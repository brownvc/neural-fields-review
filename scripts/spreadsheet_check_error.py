# -*- coding: utf-8 -*-
import csv
import collections
import unicodedata
from unidecode import unidecode
import xlsxwriter
import util
from util import csv_head_key, KNOWN_FORMATS
from tqdm import tqdm

names = {
    "Michael ZollhÃ¶fer": "Michael Zollhöfer",
    "AljaÅ¾ BoÅ¾iÄ": "Aljaž Božič",
    "boÃ…Â¾iÃ„Â_x008d_": "božič",
    "Matthias NieÃŸner": "Matthias Nießner",
    "MiloÅ¡ HaÅ¡an": "Miloš Hašan",
    "HÃ¤ni": "Häni",
    "hÃƒÂ¤ni": "häni",
    "Adam GoliÅ„ski": "Adam Goliński",
    "MichaÃ«l Gharbi": "Michaël Gharbi",
    "Dejan AzinoviÄ‡": "Dejan Azinović",
    "azinoviÃ„â€¡": "azinović",
    "Johannes BallÃ©": "Johannes Ballé",
    "Pablo GÃ³mez": "Pablo Gómez",
    "Thomas MÃ¼ller": "Thomas Müller",
    "mÃ¼ller"
    "NovÃ¡k": "Novák",
    "Mˆach´e": "Mâché",
    "âˆ’âˆ’": "−−",
    "Ã¢Ë†â€™Ã¢Ë†â€™": "−−",
    "mÃƒÂ¼ller": "müller",
    "SoÅˆa MokrÃ¡": "Soňa Mokrá"
}
non_ascii = ["PapierMâché", "Höfer", "Alenyà", "Cortés", "TöRF", "TöRF:", "Fernández", "László"]
for k in names:
    non_ascii += names[k].split(" ")

exclude_keys = ["NOTE", "ID", "ENTRYTYPE", "EPRINT", "ARCHIVEPREFIX", "PRIMARYCLASS", "FILE", "ABSTRACT"]
"""
Script begins
"""
# input_fname = "Review Paper Import Portal Responses"
input_fname = "temp/output_responses"
input_ext = ".csv"
output_fname = "temp/checked"
output_ext = ".csv"

rows = util.read_spreadsheet(input_fname, input_ext)

UIDs, pdf_links_all, wrong_pdf, missing_author, missing_nickname, missing_bibtex, missing_bibtex_name, missing_abstract, missing_UID = [], [], [], [], [], [], [], [], []
incorrect_spelling = {}

with open("scripts/papers_metadata.txt", "r") as f:
    num_rows_old = int(f.read())
# Iterate on each row
start_row = 0           # This is for skipping already processed entries
end_row = len(rows) - num_rows_old
cnt = 0
prev_pdf = ""
for j in tqdm(range(len(rows))):
    row = rows[j]
    if cnt == 0:
        cnt += 1
        continue
    # Check for duplicate pdf link
    if prev_pdf == row[csv_head_key['PDF']]:
        # print("Wrong pdf link (same as row above) at row {}".format(cnt))
        wrong_pdf.append(cnt)

    prev_pdf = row[csv_head_key['PDF']]

    # Check for missing authors
    if row[csv_head_key['Authors']] == "":
        missing_author.append(cnt)

    # Check for missing nickname
    if (0 < row[csv_head_key['Title']].find(":") < 18) and (row[csv_head_key['Nickname']] == ""):
        missing_nickname.append(cnt)

    # Check for missing bibtex citation
    bibtex_ = row[csv_head_key['Bibtex']]
    if len(bibtex_) < 10:
        missing_bibtex.append(cnt)
    elif start_row <= j <= end_row:
        comm = bibtex_.find(",")
        bibtex_ = bibtex_[:comm].replace(" ", "") + bibtex_[comm:]
        article_type, bibtex_key, dict = util.dict_from_string(bibtex_)
        bibtex_dict = {bibtex_key : dict}
        row[csv_head_key['Bibtex']] = util.format_bibtex_str(bibtex_dict, article_type=article_type, exclude_keys=exclude_keys)

    pdf_links_all.append(row[csv_head_key['PDF']])

    # Correct Venue Name
    for k in KNOWN_FORMATS:
        if row[csv_head_key['Venue']].upper() == k.upper():
            row[csv_head_key['Venue']] = k

    # Correct miss-spelling from unicode
    if start_row <= j <= end_row:
        for k in names:
            wrong_w = k.split(" ")
            correct_w = names[k].split(" ")
            assert len(wrong_w) == len(correct_w)
            for i in range(len(wrong_w)):
                # Title
                row[csv_head_key['Title']] = row[csv_head_key['Title']].replace(wrong_w[i], correct_w[i])
                row[csv_head_key['Title']] = row[csv_head_key['Title']].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
                # Nickname
                row[csv_head_key['Nickname']] = row[csv_head_key['Nickname']].replace(wrong_w[i], correct_w[i])
                row[csv_head_key['Nickname']] = row[csv_head_key['Nickname']].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
                # Bibtex
                row[csv_head_key['Bibtex']] = row[csv_head_key['Bibtex']].replace(wrong_w[i], correct_w[i])
                row[csv_head_key['Bibtex']] = row[csv_head_key['Bibtex']].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
                row[csv_head_key['Bibtex']] = unidecode(row[csv_head_key['Bibtex']])
                # Authors
                row[csv_head_key['Authors']] = row[csv_head_key['Authors']].replace(wrong_w[i], correct_w[i])
                row[csv_head_key['Authors']] = row[csv_head_key['Authors']].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
                # Bibtex handle
                row[csv_head_key['Bibtex Name']] = row[csv_head_key['Bibtex Name']].replace(wrong_w[i], correct_w[i])
                row[csv_head_key['Bibtex Name']] = row[csv_head_key['Bibtex Name']].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
                row[csv_head_key['Bibtex Name']] = unidecode(row[csv_head_key['Bibtex Name']])

    # # Posisble miss-spelling
    # if unicodedata.normalize('NFD', row[csv_head_key['Authors']]) != row[csv_head_key['Authors']]:
    #     print(cnt, row[csv_head_key['Authors']])

    # Chcek miss-spelling
    for word in row:
        if (type(word) is str) and (unicodedata.normalize('NFD', word) != word):
            for w in word.split(" "):
                w = w.replace("-", "").replace(",","")
                if (unicodedata.normalize('NFD', w) != w):
                    if w not in (non_ascii):
                        incorrect_spelling[cnt] = w
                        break

    # Bibtex name
    if len(row[csv_head_key['Bibtex Name']]) < 5:
        missing_bibtex_name.append(cnt)

    # UID
    if (row[csv_head_key['UID']] is None) \
        or (row[csv_head_key['UID']] == "") \
        or len("%08d" %int(row[csv_head_key['UID']])) < 2:
        missing_UID.append(cnt)
    else:
        UIDs.append(row[csv_head_key['UID']])

    # Abstract
    if len(row[csv_head_key['Abstract']]) < 20:
        missing_abstract.append(cnt)

    rows[j] = row
    cnt += 1

util.write_spreadsheet(rows, output_fname, output_ext)
with open("scripts/papers_metadata.txt", "w+") as f:
    f.write(str(len(rows)-1))


print("# Check for duplicate entries")
print([item for item, count in collections.Counter(pdf_links_all).items() if count > 1])
print("# Check for duplicate UID")
print([item for item, count in collections.Counter(UIDs).items() if count > 1])
print("# Check for duplicate pdf link")
print(wrong_pdf)
print("# Check for missing authors")
print(missing_author)
print("# Check for missing nickname")
print(missing_nickname)
print("# Check for missing bibtex")
print(missing_bibtex)
print("# Check for miss-spelling")
print(incorrect_spelling)
print("# Check for missing bibtex name")
print(missing_bibtex_name)
print("# Check for missing abstract")
print(missing_abstract)
print("# Check for missing UID")
print(missing_UID)
