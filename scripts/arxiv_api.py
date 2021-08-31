import csv, xlsxwriter, openpyxl
import feedparser, urllib, urllib.request
from arxiv2bib import arxiv2bib
from util import *
import unidecode

replace_name = True
capitalize_bibtex_keys = "ALL"

input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
input_fname += input_ext
output_fname = "output_responses"
output_ext = ".xlsx"
output_fname += output_ext

input_fname.replace(".csv", " - Form Responses 1.csv")
output_fname.replace(".csv", " - Form Responses 1.csv")

# Load spreadsheet
rows_in = read_spreadsheet(input_fname, input_ext)
rows_out = []

# Iterate on each row
cnt = 0
for row in rows_in:
    if (cnt == 0):
        rows_out.append(row)
        cnt += 1
        continue
    d = None
    # If paper is on arxiv and authors is empty
    if ("https://arxiv.org/pdf/" in row[4]) and (row[27] == ""):
        # Get data from arxiv api
        if d is None:
           d, id = get_arxiv(row)
        auth_str = []
        for a in d['entries'][0]['authors']:
            auth_str.append(a['name'])
        print(cnt, 'authors', ", ".join(auth_str))
        row[27] = ", ".join(auth_str)
    if ("https://arxiv.org/pdf/" in row[4]) and (row[29] == ""):
        if d is None:
           d, id = get_arxiv(row)        # Abstract
        row[29] = d['entries'][0]['summary'].replace(" \n", " ").replace("\n ", " ").replace("\n", " ")
        print(cnt, row[29][:20], "...")

    # Venue
    if ("https://arxiv.org/pdf/" in row[4]) and (row[23] == ""):
        if d is None:
           d, id = get_arxiv(row)
        if 'arxiv_comment' in d['entries'][0].keys():
            comment = d['entries'][0]['arxiv_comment']

            row[23] = get_venue(comment)
            print(cnt, row[23])

    # Bibtex
    if ("https://arxiv.org/pdf/" in row[4]) and (row[11] == ""):
        # Get bibtex string
        if d is None:
           d, id = get_arxiv(row)
        result = arxiv2bib([id])[0]
        bibtex_str = result.bibtex()

        if replace_name:
            start, end = bibtex_str.find("{") + 1, bibtex_str.find(",")
            if (row[2] != ""):
                keyword = row[2].lower().replace("-","")
            else:
                keyword = result.title.split(" ")[0].lower().replace("-","")
            lastname = result.authors[0].split(" ")[-1].lower()
            name = lastname + result.year + keyword
            bibtex_str = bibtex_str[:start] + name + bibtex_str[end:]

        bibtex_str = format_bibtex_str(bibtex_str, cap_keys=capitalize_bibtex_keys)

        if len(bibtex_str) > 10:
            row[11] = unidecode.unidecode(bibtex_str)
            print(cnt, "success", name)
        else:
            print(cnt, "ERROR: bibtex too short", bibtex_str)

    # Export bibtex name
    if row[28] == "":
        if (row[11] != ""):
            row[11] = row[11].replace("\r\n", "\n")
            start, end = row[11].find("{") + 1, row[11].find(",")
            name = row[11][start:end]
        else:
            name = ""
        row[28] = name.lower()
        print(cnt, name)

    rows_out.append(row)
    cnt += 1

util.write_spreadsheet(rows_out, output_fname, output_ext)
