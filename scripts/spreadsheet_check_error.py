# -*- coding: utf-8 -*-
import csv
import collections
import unicodedata
from unidecode import unidecode
import xlsxwriter
import util

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
non_ascii = ["PapierMâché", "Höfer", "Alenyà", "Cortés", "TöRF", "TöRF:", "Fernández"]
for k in names:
    non_ascii += names[k].split(" ")

known_nonunicode_rows = [5, 11, 29, 33, 35, 50, 54, 63, 64, 73, 77, 79, 97, 100, 103, 113, 114, 128, 141, 155]
input_fname = "output_responses"
# input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
output_fname = input_fname
output_fname = "checked"
output_ext = ".xlsx"

reader = util.read_spreadsheet(input_fname, input_ext)

pdf_links_all, wrong_pdf, missing_author, missing_nickname, missing_bibtex, missing_bibtex_name, missing_abstract, missing_UID = [], [], [], [], [], [], [], []
incorrect_spelling = {}
rows = []
cnt = 0
prev_pdf = ""
for row in reader:
    if cnt == 0:
        rows.append(row)
        cnt += 1
        continue
    # Check for duplicate pdf link
    if prev_pdf == row[4]:
        # print("Wrong pdf link (same as row above) at row {}".format(cnt+1))
        wrong_pdf.append(cnt+1)

    prev_pdf = row[4]

    # Check for missing authors
    if row[27] == "":
        missing_author.append(cnt+1)

    # Check for missing nickname
    if (0 < row[1].find(":") < 18) and (row[2] == ""):
        missing_nickname.append(cnt+1)

    # Check for missing bibtex citation
    if len(row[11]) < 10:
        missing_bibtex.append(cnt+1)
    else:
        comm = row[11].find(",")
        row[11] = row[11][:comm].replace(" ", "") + row[11][comm:]
        article_type, bibtex_key, dict = util.dict_from_string(row[11])
        bibtex_dict = {bibtex_key : dict}
        row[11] = util.format_bibtex_str(bibtex_dict, article_type=article_type)

    pdf_links_all.append(row[4])

    # Correct miss-spelling from unicode
    for k in names:
        wrong_w = k.split(" ")
        correct_w = names[k].split(" ")
        assert len(wrong_w) == len(correct_w)
        for i in range(len(wrong_w)):
            # Title
            row[1] = row[1].replace(wrong_w[i], correct_w[i])
            row[1] = row[1].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            # Nickname
            row[2] = row[2].replace(wrong_w[i], correct_w[i])
            row[2] = row[2].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            # Bibtex
            row[11] = row[11].replace(wrong_w[i], correct_w[i])
            row[11] = row[11].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            row[11] = unidecode(row[11])
            # Authors
            row[27] = row[27].replace(wrong_w[i], correct_w[i])
            row[27] = row[27].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            # Bibtex handle
            row[28] = row[28].replace(wrong_w[i], correct_w[i])
            row[28] = row[28].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            row[28] = unidecode(row[28])

    # # Posisble miss-spelling
    # if unicodedata.normalize('NFD', row[27]) != row[27]:
    #     print(cnt, row[27])

    # Chcek miss-spelling
    for word in row:
        if (type(word) is str) and (unicodedata.normalize('NFD', word) != word):
            for w in word.split(" "):
                w = w.replace("-", "").replace(",","")
                if (unicodedata.normalize('NFD', w) != w):
                    if w not in (non_ascii):
                        incorrect_spelling[cnt+1] = w
                        break

    # Bibtex name
    if len(row[28]) < 5:
        missing_bibtex_name.append(cnt+1)

    # UID
    if len(row[29]) < 2:
        missing_UID.append(cnt+1)

    # Abstract
    if len(row[30]) < 20:
        missing_abstract.append(cnt+1)

    cnt += 1
    rows.append(row)

util.write_spreadsheet(rows, output_fname, output_ext)


print("# Check for duplicate entries")
print([item for item, count in collections.Counter(pdf_links_all).items() if count > 1])
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
