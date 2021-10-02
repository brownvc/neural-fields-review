"""
API 1:
arxiv api
Use arxivapi and arxiv2bib
- Date
- Authors
- Bibtex citation
- ABSTRACT

API 2:
Use package scholarly (https://scholarly.readthedocs.io/en/stable/)
to get the following information:
- Bibtex citation
- Authors
- Citedby (count)
Stuff it's not good at:
- Abstract (often truncated)
- Venue (often truncated)
This is especially useful if the paper is not on ArXiv.
"""

import csv, xlsxwriter, openpyxl
import feedparser, urllib, urllib.request
from arxiv2bib import arxiv2bib
from util import *
import unidecode
from tqdm import tqdm

debug = True
overwrite_existing = True
replace_bibtex_key = True                 # Reformat bibtex name to our convention
citations_cnt = False
capitalize_bibtex_keys = "ALL"

input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
output_fname = "output_responses"
output_ext = ".xlsx"
input_fname.replace(".csv", " - Form Responses 1.csv")
output_fname.replace(".csv", " - Form Responses 1.csv")

# Load spreadsheet
rows = read_spreadsheet(input_fname, input_ext)

# Iterate on each row
cnt = 0
start_row = 235           # This is for skipping already processed entries
for r in tqdm(range(start_row, len(rows))):
    d, search_result, bibtex_str, bibtex_dict, dict = None, None, None, None, None
    row = rows[r]

    if (cnt == 0):
        cnt += 1
        continue

    # Date
    if ("https://arxiv.org/" in row[4]) and (row[3] == ""):
        if d is None:
           d, id = get_arxiv(row)
        year = d['entries'][0]['published'][:4]
        month = d['entries'][0]['published'][5:7]
        day = d['entries'][0]['published'][8:10]
        row[3] = month + '/' + day + '/' + year
        print(cnt+1, row[3])

    # Bibtex
    if (row[11] == "") or overwrite_existing:
        if row[23] == "":
            print(cnt+1, "ERROR (Venue): empty")
            if debug: exit(12)
            continue
        else:
            s = row[23]
            if s.find("(") > 0:
                s = s[:s.find("(")]
            venue = s.strip(" 0123456789")
            venue_year = s.strip(" ")
            try:
                year = venue_year.split(' ')[-1]
                assert len(year) == 4, f"ERROR (year in vanue is not valid): {year}"
            except Exception as e:
                print(e)
                if debug: exit(12)
                continue

        # Step 1) Get bibtex from arxiv
        if "https://arxiv.org/" in row[4]:
            if d is None:
               d, id = get_arxiv(row)
            result = arxiv2bib([id])[0]
            bibtex_str = result.bibtex()
        # Step 1) Get bibtex from scholarly
        elif len(row[11]) < 10:
            search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
            bibtex_str = scholarly.bibtex(search_result)
        else:
            bibtex_str = row[11]
        try:
            article_type, bibtex_key, dict = dict_from_string(bibtex_str)
        except Exception as e:
            print("ERROR (BibTexParser, possible malformed bibtex entry): ", e, "\n", bibtex_str)

        # Step 2) Format authors: last name last
        if 'author' in dict:
            authors = get_authors_from_bibtex(dict)
            dict['author'] = ' and '.join(authors)
        else:
            print("ERROR (no author in bibtex): ", dict)
            if debug: exit(12)
            continue
        # Step 3) Replace bibtex key
        if replace_bibtex_key:
            if (row[2] != ""):
                keyword = row[2].split(",")[0].lower().replace("-","").replace(" ","")
            else:
                keyword = row[1].split(" ")[0].lower().replace("-","").replace(" ","")
            lastname = authors[0].split(" ")[-1].lower()
            bibtex_key = lastname + year + keyword
        # Step 4) Add/Update additional info from venue
        if venue in KNOWN_FORMATS:
            if 'month' in dict:
                dict.pop('month')
            dict['year'] = year
            if venue in TYPE:
                article_type = TYPE[venue]
            for k in BIBTEX_INFO:
                if venue in BIBTEX_INFO[k]:
                    dict[k] = BIBTEX_INFO[k][venue]
            if venue == "ARXIV":
                if "https://arxiv.org/" in row[4]:
                   dict['journal'] += " arXiv:" + row[4].strip("https://arxiv.org/pdf/")
        bibtex_dict = {bibtex_key : dict}
        # Format the final bibtex string
        bibtex_str = ""
        bibtex_str = format_bibtex_str(bibtex_dict, article_type=article_type)
        try:
            bibtex_str = format_bibtex_str(bibtex_dict, article_type=article_type)
        except Exception as e:
            print("Error: format_bibtex_str", e)
            if debug: exit(12)

        if len(bibtex_str) > 10:
            row[11] = unidecode.unidecode(bibtex_str)
            print(cnt+1, "Bibtex: ", row[11][:20])
        else:
            print(cnt+1, "Bibtex ERROR (bibtex too short): ", bibtex_str)
            if debug: exit(12)

    # Export bibtex name
    if (row[28] == "") or overwrite_existing:
        if (row[11] != ""):
            row[28] = bibtex_name_from_bibtex(row[11])
            print(cnt+1, "Bibtex Name: ", row[28])
            if " " in row[28]:
                print(cnt+1, "Bibtex name contains space: ", row[28])

    # Authors
    if row[27] == "":
        # From arxiv api
        if ("https://arxiv.org/" in row[4]):
            if d is None:
               d, id = get_arxiv(row)
            auth_str = []
            for a in d['entries'][0]['authors']:
                auth_str.append(a['name'])
            auth_str_out = ", ".join(auth_str)
        # From bibtex
        elif (row[11] != ""):
            if bibtex_dict is None:
                dict = dict_from_string(row[11])
            auth_str_out = ", ".join(get_authors_from_bibtex(dict))
        row[27] = auth_str_out
        print(cnt+1, "Authors:", row[27])

    # Abstract
    if (len(row[30]) < 10) or overwrite_existing:
        abstract = ""
        # From arxiv api
        if ("https://arxiv.org/" in row[4]):
            if d is None:
                d, id = get_arxiv(row)
            abstract = d['entries'][0]['summary'].replace(" \n", " ").replace("\n ", " ").replace("\n", " ")
        # From bibtex
        elif (row[11] != ""):
            if bibtex_dict is None:
                _, _, dict = dict_from_string(row[11])
            if 'abstract' in dict:
                abstract = dict['abstract']
        # From scholarly
        if abstract == "":
            search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
            try:
                abstract = search_result['bib']['abstract'].replace(' \n', ' ').replace('\n', '')
                for i in range(5):
                    abstract = abstract.replace(' '*(5-i), ' ')
            except Exception as e:
                print(e)
        if len(abstract) > 20:
            row[30] = abstract
            print(cnt+1, "Abstract: ", row[30][:20], "...")

    # Citations count
    if (row[31] == "") and citations_cnt:
        search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
        try:
            citations = search_result['num_citations']
            row[31] = citations
            print(cnt, "citations count: ", row[31])
        except Exception as e:
            print(e)

    cnt += 1
    rows[r] = row
    write_spreadsheet(rows, output_fname, output_ext)
