import csv, xlsxwriter, openpyxl
import feedparser, urllib, urllib.request
from arxiv2bib import arxiv2bib
from util import *
import unidecode
from tqdm import tqdm

# @profile
def run():
    """
    python scripts/run_api.py
    python scripts/spreadsheet_check_error.py
    mv temp/checked.csv sitedata/papers.csv

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

    csv_format = "New"
    write_every = False
    debug = True
    overwrite_existing = False
    replace_bibtex_key = True                 # Reformat bibtex name to our convention
    citations_cnt = False
    capitalize_bibtex_keys = "ALL"

    # input_fname = "Review Paper Import Portal Responses"
    # input_fname = "Neural Fields_ Paper Import Portal (Responses)"
    # input_ext = ".xlsx"
    input_fname = "sitedata/papers"
    input_ext = ".csv"
    output_fname = "temp/output_responses"
    output_ext = ".csv"

    # Load spreadsheet
    rows = read_spreadsheet(input_fname, input_ext)
    # This doesn't include row(0)
    with open("scripts/papers_metadata.txt", "r") as f:
        num_rows_old = int(f.read())

    max_uid = util.find_max_uid(rows)
    # Iterate on each row
    start_row = 0           # This is for skipping already processed entries
    end_row = (len(rows) - 1) - num_rows_old
    cnt = start_row
    for r in tqdm(range(start_row, end_row)):
        d, search_result, bibtex_str, bibtex_dict, dict = None, None, None, None, None
        err = False
        row = rows[r]

        if (cnt == 0):
            cnt += 1
            continue

        if len(str(row[csv_head_key["UID"]])) == 0:
            row[csv_head_key["UID"]] = max_uid

        if ("https://arxiv.org/" in row[csv_head_key['PDF']]):
            serial_num = row[csv_head_key['PDF']].strip("https://arxiv.org/abs/pdf")
            if "https://arxiv.org/ftp/arxiv/papers" in row[csv_head_key['PDF']]:
                # "https://arxiv.org/ftp/arxiv/papers/2108/2108.10991.pdf"
                serial_num = row[csv_head_key['PDF']][40:50]
            elif len(serial_num) != 10:
                print("Unknown ARXIV PDF link format: ", row[csv_head_key['PDF']])
                continue
            else:
                row[csv_head_key['PDF']] = f"https://arxiv.org/pdf/{serial_num}.pdf"

        # Date
        if ("https://arxiv.org/" in row[csv_head_key['PDF']]) and (row[csv_head_key['Date']] == ""):
            if d is None:
               d, id = get_arxiv(row)
            year = d['entries'][0]['published'][:4]
            month = d['entries'][0]['published'][5:7]
            day = d['entries'][0]['published'][8:10]
            row[csv_head_key['Date']] = month + '/' + day + '/' + year
            print(r, row[csv_head_key['Date']])

        # Bibtex
        if (row[csv_head_key['Bibtex']] == "") or overwrite_existing:
            if csv_format == "old":
                if row[csv_head_key['Venue']] == "":
                    print(r, "ERROR (Venue): empty")
                    if debug: exit(12)
                    continue
                else:
                    s = row[csv_head_key['Venue']]
                    if s.find("(") > 0:
                        s = s[:s.find("(")]
                    for venue in KNOWN_FORMATS:
                        if venue in s:
                            break
                    venue_year = s.strip(" ")
                    try:
                        year = venue_year.split(' ')[-1]
                        assert len(year) == 4, f"ERROR (year in vanue is not valid): {year}"
                    except Exception as e:
                        print(e)
                        if debug: exit(12)
                        continue
            else:
                if row[csv_head_key['Venue']] == "":
                    print(r, "ERROR (Venue): empty")
                    if debug: exit(12)
                elif row[csv_head_key['Year']] == "":
                    print(r, "ERROR (Year): empty")
                    if debug: exit(12)
                else:
                    venue = row[csv_head_key['Venue']]
                    venue = venue[:venue.find("(")].strip(" ")
                    year = str(int(row[csv_head_key['Year']]))
                    if debug: assert len(year) == 4, f"ERROR (year in vanue is not valid): {year}"

            # Step 1) Get bibtex from arxiv
            if "https://arxiv.org/" in row[csv_head_key['PDF']]:
                if d is None:
                   d, id = get_arxiv(row)
                result = arxiv2bib([id])[0]
                bibtex_str = result.bibtex()
            # Step 1) Get bibtex from scholarly
            elif len(row[csv_head_key['Bibtex']]) < 10:
                search_result = get_scholarly_result(row[csv_head_key['Title']]) if (search_result is None) else search_result
                bibtex_str = scholarly.bibtex(search_result)
            else:
                bibtex_str = row[csv_head_key['Bibtex']]
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
                if (row[csv_head_key['Nickname']] != ""):
                    keyword = row[csv_head_key['Nickname']].split(",")[0].lower().replace("-","").replace(" ","")
                else:
                    keyword = row[csv_head_key['Title']].split(" ")[0].lower().replace("-","").replace(" ","")
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
                    if "https://arxiv.org/" in row[csv_head_key['PDF']]:
                       dict['journal'] += " arXiv:" + serial_num
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
                row[csv_head_key['Bibtex']] = unidecode.unidecode(bibtex_str)
                # todo
                print(r, "Bibtex: ", row[csv_head_key['Bibtex']][:20])
            else:
                print(r, "Bibtex ERROR (bibtex too short): ", bibtex_str)
                if debug: exit(12)

        # Export bibtex name
        if (row[csv_head_key['Bibtex Name']] == "") or overwrite_existing:
            if (row[csv_head_key['Bibtex']] != ""):
                row[csv_head_key['Bibtex Name']] = bibtex_name_from_bibtex(row[csv_head_key['Bibtex']])
                print(r, "Bibtex Name: ", row[csv_head_key['Bibtex Name']])
                if " " in row[csv_head_key['Bibtex Name']]:
                    print(r, "Bibtex name contains space: ", row[csv_head_key['Bibtex Name']])

        # Authors
        if row[csv_head_key['Authors']] == "":
            # From arxiv api
            if ("https://arxiv.org/" in row[csv_head_key['PDF']]):
                if d is None:
                   d, id = get_arxiv(row)
                auth_str = []
                for a in d['entries'][0]['authors']:
                    auth_str.append(a['name'])
                auth_str_out = ", ".join(auth_str)
            # From bibtex
            elif (row[csv_head_key['Bibtex']] != ""):
                if bibtex_dict is None:
                    try:
                        _, _, dict = dict_from_string(row[csv_head_key['Bibtex']])
                    except Exception as e:
                        print(e)
                        print("BibTexParser Error. Skipping")
                        err = True
                if not err:
                    auth_str_out = ", ".join(get_authors_from_bibtex(dict))
            if not err:
                row[csv_head_key['Authors']] = auth_str_out
            print(r, "Authors:", row[csv_head_key['Authors']])

        # Abstract
        if (len(row[csv_head_key['Abstract']]) < 10) or overwrite_existing:
            abstract = ""
            # From arxiv api
            if ("https://arxiv.org/" in row[csv_head_key['PDF']]):
                if d is None:
                    d, id = get_arxiv(row)
                abstract = d['entries'][0]['summary'].replace(" \n", " ").replace("\n ", " ").replace("\n", " ")
            # From bibtex
            elif (row[csv_head_key['Bibtex']] != ""):
                if bibtex_dict is None:
                    _, _, dict = dict_from_string(row[csv_head_key['Bibtex']])
                if 'abstract' in dict:
                    abstract = dict['abstract']
            # From scholarly
            if abstract == "":
                search_result = get_scholarly_result(row[csv_head_key['Title']]) if (search_result is None) else search_result
                try:
                    abstract = search_result['bib']['abstract'].replace(' \n', ' ').replace('\n', '')
                    for i in range(5):
                        abstract = abstract.replace(' '*(5-i), ' ')
                except Exception as e:
                    print(e)
            if len(abstract) > 20:
                row[csv_head_key['Abstract']] = abstract
                print(r, "Abstract: ", row[csv_head_key['Abstract']][:20], "...")

        # Citations count
        if (row[csv_head_key['Citation Count']] == "") and citations_cnt:
            search_result = get_scholarly_result(row[csv_head_key['Title']]) if (search_result is None) else search_result
            try:
                citations = search_result['num_citations']
                row[csv_head_key['Citation Count']] = citations
                print(cnt, "citations count: ", row[csv_head_key['Citation Count']])
            except Exception as e:
                print(e)

        cnt += 1
        rows[r] = row
        if write_every:
            write_spreadsheet(rows, output_fname, output_ext)
    write_spreadsheet(rows, output_fname, output_ext)

if __name__ == "__main__":
    run()
