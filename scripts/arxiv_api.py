import csv, xlsxwriter, openpyxl
import feedparser, urllib, urllib.request
from arxiv2bib import arxiv2bib

input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
input_fname += input_ext
output_fname = "output_responses"
output_ext = ".xlsx"
output_fname += output_ext

input_fname.replace(".csv", " - Form Responses 1.csv")
output_fname.replace(".csv", " - Form Responses 1.csv")

# Load spreadsheet
rows_in, rows_out = [], []
if (input_ext == ".xlsx"):
    workbook = openpyxl.load_workbook(input_fname)
    sheet = workbook.active
    for row in sheet.iter_rows():
        row_in = []
        allNone = True
        for cell in row:
            if cell.value is None:
                row_in.append("")
            else:
                allNone = False
                row_in.append(cell.value)
        if allNone: continue
        rows_in.append(row_in)
elif (input_ext == ".csv"):
    with open(input_fname, newline='', encoding="utf-8") as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='"')
        for row in reader:
            rows_in.append(row)

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
            id = row[4][22:32]
            url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
            data = urllib.request.urlopen(url)
            d = feedparser.parse(data.read().decode('utf-8'))

        # Authors
        auth_str = []
        for a in d['entries'][0]['authors']:
            auth_str.append(a['name'])
        print(cnt, 'authors', ", ".join(auth_str))
        row[27] = ", ".join(auth_str)
    if ("https://arxiv.org/pdf/" in row[4]) and (row[29] == ""):
        if d is None:
            id = row[4][22:32]
            url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
            data = urllib.request.urlopen(url)
            d = feedparser.parse(data.read().decode('utf-8'))
        # Abstract
        row[29] = d['entries'][0]['summary'].replace(" \n", " ").replace("\n ", " ").replace("\n", " ")
        print(cnt, row[29][:20], "...")
    # Bibtex
    if ("https://arxiv.org/pdf/" in row[4]) and (row[11] == ""):
        if d is None:
            id = row[4][22:32]
            url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
            data = urllib.request.urlopen(url)
            d = feedparser.parse(data.read().decode('utf-8'))

        result = arxiv2bib([id])[0]
        bibtex_str = result.bibtex()

        replace_name = True
        if replace_name:
            start, end = bibtex_str.find("{") + 1, bibtex_str.find(",")
            if (row[2] != ""):
                keyword = row[2].lower().replace("-","")
            else:
                keyword = result.title.split(" ")[0].lower().replace("-","")
            lastname = result.authors[0].split(" ")[-1].lower()
            name = lastname + result.year + keyword
            bibtex_str = bibtex_str[:start] + name + bibtex_str[end:]

        if len(bibtex_str) > 10:
            row[11] = bibtex_str.replace("\r\n", "\n")
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

if (output_ext == ".csv"):
    with open(csv_name, "w", newline='', encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(rows_out)
elif (output_ext == ".xlsx"):
    # Create a workbook and add a worksheet.
    workbook = xlsxwriter.Workbook(output_fname)
    worksheet = workbook.add_worksheet()
    # Start from the first cell. Rows and columns are zero indexed.
    row = 0
    col = 0

    # Iterate over the data and write it out row by row.
    for r in rows_out:
        for c in r:
            worksheet.write(row, col, c)
            col += 1
        row += 1
        col = 0
    workbook.close()
