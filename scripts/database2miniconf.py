# -*- coding: utf-8 -*-
import csv
import openpyxl
import pathlib, os
from util import read_spreadsheet
import unidecode

input_fname = "Review Paper Import Portal Responses"
ext = ".xlsx"   # ".csv"
input_fname += ext
rows_in = read_spreadsheet(input_fname, ext)
input_fname.replace(".csv", " - Form Responses 1.csv")

rows_in = read_spreadsheet(input_fname, ext)

rows_out = [["UID","title","authors","abstract","keywords","sessions"]]
cnt = 0
for row in rows_in:
    if cnt == 0:
        cnt += 1
        continue

    rows_out.append([
        row[29],                                                # UID
        unidecode.unidecode(row[1]),                            # Title
        "|".join(unidecode.unidecode(row[27]).split(", ")),     # Authors
        unidecode.unidecode(row[30]),                           # Abstract
        "|".join(row[12].split(", ") + row[13].split(", ")),    # Keywords
        "",                                                     # Sessions
    ])
    cnt += 1

out_path = os.path.join(pathlib.Path(__file__).parent.parent.resolve(), "sitedata", "papers.csv")
with open(out_path, "w", newline='', encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerows(rows_out)
