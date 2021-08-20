# -*- coding: utf-8 -*-
import csv
import openpyxl
import pathlib, os

input_fname = "Review Paper Import Portal Responses - Form Responses 1"
# ext = ".csv"
ext = ".xlsx"
input_fname += ext

rows = [["UID","title","authors","abstract","keywords","sessions"]]
if (ext == ".xlsx"):
    workbook = openpyxl.load_workbook(input_fname)
    sheet = workbook.active
    cnt = -1
    for row in sheet.iter_rows():
        if row == -1:
            row += 1
            continue
        print(row[1].value)

        rows.append([
            row[29],       # UID
            unidecode.unidecode(row[1]),             # Title
            unidecode.unidecode(row[27]).split(", ").join("|"),     # Authors
            unidecode.unidecode(row[30]),            # Abstract
            "",                 # Keywords
            "",                 # Sessions
        ])
        cnt += 1
out_path = os.path.join(pathlib.Path(__file__).parent.parent.resolve(), "sitedata", "papers.csv")
with open(out_path, "w", newline='', encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerows(rows)
