import openpyxl, csv
import urllib, feedparser

def get_arxiv(row):
    id = row[4][22:32]
    url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
    data = urllib.request.urlopen(url)
    d = feedparser.parse(data.read().decode('utf-8'))
    return d


def read_spreadsheet(input_fname, input_ext):
    rows_in = []
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

    return rows_in