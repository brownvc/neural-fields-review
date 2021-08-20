import csv

csv_name = "Review Paper Import Portal Responses - Form Responses 1.csv"


bibtex = []
with open(csv_name, newline='', encoding="utf-8") as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='"')
    cnt = 0
    
    for row in reader:
        if cnt == 0:
            cnt += 1
            continue
        bibtex.append(row[11].replace("\r\n", "\n")+"\n\n")

with open("references.bib", "w+", encoding="utf-8") as f:
    f.writelines(bibtex)
