import openpyxl, csv
import urllib, feedparser

def get_arxiv(row):
    id = row[4][22:32]
    url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
    data = urllib.request.urlopen(url)
    d = feedparser.parse(data.read().decode('utf-8'))
    return d, id


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


def capitalize_keys(texstr):
    ind = 0
    cnt = 0
    while ind < len(texstr):
        nl = texstr[ind:].find("\n") + ind
        eq = texstr[nl:].find("=") + nl
        if (eq - nl) == -1:
            break
        # Make the key CAPITALIZED
        texstr = texstr[:nl+1] + texstr[nl+1:eq].upper() + texstr[eq:]

        # Skip the value (bracketed)
        left = texstr[eq:].find("{") + eq
        if (left - eq) == -1:
            break
        ind = left + 1
        left_cnt = 1
        right_cnt = 0
        while (left_cnt > right_cnt):
            left = texstr[ind:].find("{") + ind
            right = texstr[ind:].find("}") + ind
            print(left_cnt, right_cnt, left, right, ind, len(texstr))
            if (left < right) and ((left - ind) != -1):
                left_cnt += 1
                ind = left + 1
            elif (right - ind) != -1:
                right_cnt += 1
                ind = right + 1
            cnt += 1
            if cnt > 20:
                raise ValueError("Yiheng wrote a bug... check for infinite while loop here")

    return texstr