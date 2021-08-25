import openpyxl, csv
import urllib, feedparser
import xlsxwriter

def get_arxiv(row):
    id = row[4][22:32]
    url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
    data = urllib.request.urlopen(url)
    d = feedparser.parse(data.read().decode('utf-8'))
    return d, id


def read_spreadsheet(input_fname, input_ext):
    rows_in = []
    if (input_ext == ".xlsx"):
        workbook = openpyxl.load_workbook(input_fname + input_ext)
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
        with open(input_fname + input_ext, newline='', encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile, delimiter=',', quotechar='"')
            for row in reader:
                rows_in.append(row)

    return rows_in


def write_spreadsheet(rows, fname, ext):

    if ext == ".csv":
        with open(fname + ext, "w+", newline='', encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(rows)
    elif ext == ".xlsx":
        # Create a workbook and add a worksheet.
        workbook = xlsxwriter.Workbook(fname + ext)
        worksheet = workbook.add_worksheet()
        # Start from the first cell. Rows and columns are zero indexed.
        row = 0
        col = 0

        # Iterate over the data and write it out row by row.
        for r in rows:
            for c in r:
                worksheet.write(row, col, c)
                col += 1
            row += 1
            col = 0
        workbook.close()


def format_bibtex_str(texstr, cap_keys="ALL", space=True, indent="    ", remove_newline_in_value=True):
    """
    Args:
        cap_keys: {"ALL", "Initial", "lower"}
    """
    indents = {"\t", " ", "  ", "    ", "          ", "\r"}

    # print(texstr)
    ind = 0
    cnt = 0
    while ind < len(texstr):
        nl = texstr[ind:].find("\n") + ind
        eq = texstr[nl:].find("=") + nl
        bra = texstr[eq:].find("{") + eq
        if (eq - nl) == -1:
            break

        # Format key
        key = texstr[nl+1:eq].replace(" ", "").replace("\t","").replace("\r","").lower()
        if cap_keys == "ALL":
            key = key.upper()
        elif cap_keys == "Initial":
            key = key[0].upper() + key[1:]

        if space:
            equal = " = "
        else:
            equal = "="
        orig_len = len(texstr)
        texstr = texstr[:nl+1] + key + equal + texstr[bra:]
        bra += len(texstr) - orig_len

        # Skip the value (bracketed)
        left = bra
        if (left - eq) == -1:
            break
        ind = left + 1
        left_cnt = 1
        right_cnt = 0
        while (left_cnt > right_cnt):
            left = texstr[ind:].find("{") + ind
            right = texstr[ind:].find("}") + ind
            # print(left, right, left_cnt, right_cnt, ind, repr(texstr[ind:ind+10]))
            if (left < right) and ((left - ind) != -1):
                left_cnt += 1
                ind = left + 1
            elif (right - ind) != -1:
                right_cnt += 1
                ind = right + 1
            cnt += 1
            if cnt > 20:
                raise ValueError("Yiheng wrote a bug... check for infinite while loop here")
        ket = right
        if remove_newline_in_value:
            braket = texstr[bra:ket]
            for i in indents:
                braket = braket.replace("\n"+i, "")
            braket = braket.replace("\n", "")
            texstr = texstr[:bra] + braket + texstr[ket:]

    if indent is not None:
        for i in indents:
            texstr = texstr.replace("\n"+i+i, "\n")
            texstr = texstr.replace("\n"+i, "\n")

        texstr = texstr.replace("\n", "\n"+indent)
        if texstr[-(2+len(indent)):] == "\n"+indent+"}":
            texstr = texstr[:-(2+len(indent))] + "\n}"
    return texstr