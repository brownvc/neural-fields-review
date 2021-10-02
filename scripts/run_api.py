"""
API 1:
arxiv api
Use arxivapi and arxiv2bib
- Date
- Authors
- Bibtex citation
- ABSTRACT
- Venue

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
from export_bibtex import Bibtex
from util import *
import unidecode
from tqdm import tqdm

overwrite_existing = True
replace_bibtex_key = True                 # Reformat bibtex name to our convention
capitalize_bibtex_keys = "ALL"

input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
output_fname = "output_responses"
output_ext = ".xlsx"
input_fname.replace(".csv", " - Form Responses 1.csv")
output_fname.replace(".csv", " - Form Responses 1.csv")

# Load spreadsheet
rows_in = read_spreadsheet(input_fname, input_ext)
rows_out = []

# Iterate on each row
cnt = 0
start_row = 0           # This is for skipping already processed entries
for r in tqdm(range(start_row, len(rows))):
    d, search_result, bibtex_str, bibtex_dict, = None, None, None, None
    row = rows[r]

    if (cnt == 0):
        rows_out.append(row)
        cnt += 1
        continue
    d = None

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
        if row[23] == ""
            print(cnt+1, "ERROR (Venue): empty")
            continue
        else:
            s = row[23]
            if venue.find("(") > 0:
                s = s[:venue.find("(")]
            venue = s.strip(" 0123456789")
            venue_year = s.strip(" ")
            year = venue_year.split(' ')[1]

        # todo: remove
        if (venue in KNOWN_FORMATS) or (row[11] == ""):
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

            article_type, bibtex_key, d = Bibtex(bibtex_str)
            # Step 2) Format authors: last name last
            if 'author' in d:
                d['author'] = get_authors_from_bibtex(bibtex_dict)
            # Step 3) Replace bibtex key
            if replace_bibtex_key:
                if (row[2] != ""):
                    keyword = row[2].lower().replace("-","")
                else:
                    keyword = row[1].split(" ")[0].lower().replace("-","").replace(" ","")
                lastname = d["author"][0].split(" ")[-1].lower()
                bibtex_key = lastname + result.year + keyword
            # Step 4) Add/Update additional info from venue
            if venue in KNOWN_FORMATS:
                d.pop('month')
                if len(year) == 4:
                    d['year'] = year
                if venue in TYPE:
                    article_type = TYPE[venue]
                for k in BIBTEX_INFO:
                    if venue in k:
                        d[k] = BIBTEX_INFO[k][venue]
                if venue == "ARXIV":
                    if "https://arxiv.org/" in row[4]:
                       d['journal'] += "arXiv:" + row[4].strip("https://arxiv.org/pdf/")
            bibtex_dict = {bibtex_key : d}
            # Format the final bibtex string
            bibtex_str = ""
            try:
                bibtex_str = format_bibtex_str(bibtex_dict, article_type=article_type)
            except Exception as e:
                print(e)

            if len(bibtex_str) > 10:
                row[11] = unidecode.unidecode(bibtex_str)
                print(cnt+1, "Bibtex: ", row[11][:20])
            else:
                print(cnt+1, "Bibtex ERROR (bibtex too short): ", bibtex_str)

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
            authors = ", ".join(auth_str)
        # From bibtex
        elif (row[11] != ""):
            if bibtex_dict is None:
                bibtex_dict =
            authors = ", ".join(get_authors_from_bibtex(row[11]))
        row[27] = authors
        print(cnt+1, "Authors:", row[27])

    # Abstract
    if (len(row[30]) < 10):
        # From arxiv api
        if ("https://arxiv.org/" in row[4]):
            if d is None:
               d, id = get_arxiv(row)
            row[30] = d['entries'][0]['summary'].replace(" \n", " ").replace("\n ", " ").replace("\n", " ")
            print(cnt+1, row[30][:20], "...")
        # From bibtex
        elif (row[11] != ""):
            if bibtex_dict is None:
                _, _, d =
            else:
    cnt += 1
    rows[r] = row
    write_spreadsheet(rows, output_fname, output_ext)
