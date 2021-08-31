# -*- coding: utf-8 -*-
import csv
import collections
import unicodedata
import xlsxwriter
import util

names = {
    "Michael ZollhÃ¶fer": "Michael Zollhöfer",
    "AljaÅ¾ BoÅ¾iÄ": "Aljaž Božič",
    "Matthias NieÃŸner": "Matthias Nießner",
    "MiloÅ¡ HaÅ¡an": "Miloš Hašan",
    "Nicolai HÃ¤ni": "Nicolai Häni",
    "Adam GoliÅ„ski": "Adam Goliński",
    "MichaÃ«l Gharbi": "Michaël Gharbi",
    "Dejan AzinoviÄ‡": "Dejan Azinović",
    "Johannes BallÃ©": "Johannes Ballé",
    "Pablo GÃ³mez": "Pablo Gómez",
    "Thomas MÃ¼ller": "Thomas Müller",
    "mÃ¼ller"
    "Jan NovÃ¡k": "Jan Novák",
    "Mˆach´e": "Mâché",
    "âˆ’âˆ’": "−−",
    "mÃƒÂ¼ller": "müller",
    "SoÅˆa MokrÃ¡": "Soňa Mokrá"
}
known_nonunicode_rows = [5, 11, 29, 33, 35, 50, 54, 63, 64, 73, 77, 79, 97, 100, 103, 113, 114, 128, 141, 155]
input_fname = "output_responses"
# input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
output_fname = input_fname
output_ext = ".xlsx"

reader = util.read_spreadsheet(input_fname, input_ext)

pdf_links_all, wrong_pdf, missing_author, missing_nickname, missing_bibtex, missing_bibtex_name, incorrect_spelling, missing_abstract, missing_UID = [], [], [], [], [], [], [], [], []
rows = []
cnt = 0
prev_pdf = ""
for row in reader:
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
    if row[11] == "":
        missing_bibtex.append(cnt+1)
    else:
        row[11] = util.format_bibtex_str(row[11])

    pdf_links_all.append(row[4])
    cnt += 1

    # Correct miss-spelling from unicode
    for k in names:
        wrong_w = k.split(" ")
        correct_w = names[k].split(" ")
        assert len(wrong_w) == len(correct_w)
        for i in range(len(wrong_w)):
            row[1] = row[1].replace(wrong_w[i], correct_w[i])
            row[1] = row[1].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            row[2] = row[2].replace(wrong_w[i], correct_w[i])
            row[2] = row[2].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            row[11] = row[11].replace(wrong_w[i], correct_w[i])
            row[11] = row[11].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            row[27] = row[27].replace(wrong_w[i], correct_w[i])
            row[27] = row[27].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])
            row[28] = row[28].replace(wrong_w[i], correct_w[i])
            row[28] = row[28].replace(wrong_w[i][0].lower()+wrong_w[i][1:], correct_w[i][0].lower()+correct_w[i][1:])

    # # Posisble miss-spelling
    # if unicodedata.normalize('NFD', row[27]) != row[27]:
    #     print(cnt, row[27])

    # Chcek miss-spelling
    if (cnt+1) not in known_nonunicode_rows:
        for word in row:
            if (type(word) is str) and (unicodedata.normalize('NFD', word) != word):
                incorrect_spelling.append(cnt+1)
                # print(word)
                break

    # UID
    if len(row[28]) < 20:
        missing_bibtex_name.append(cnt+1)

    # UID
    if len(row[29]) < 20:
        missing_UID.append(cnt+1)

    # Abstract
    if len(row[30]) < 20:
        missing_abstract.append(cnt+1)


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


