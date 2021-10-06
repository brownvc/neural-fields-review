import csv
import util

"""
Eject unnecessary bibtex fileds from papers.csv 
"""

papers_file_path = "../sitedata/papers.csv"
out_file_path = "../sitedata/papers.csv"
exclude_keys = [
    "NOTE",
    "ID",
    "ENTRYTYPE",
    "EPRINT",
    "ARCHIVEPREFIX",
    "PRIMARYCLASS",
    "FILE",
    "ABSTRACT",
    # "URL",
]

out_rows = []

with open(papers_file_path) as csv_file:
    line = 0
    csv_reader = csv.reader(csv_file, delimiter=',')
    csv_header = None
    for row in csv_reader:
        if line == 0:
            csv_header = row[:]
            out_rows.append(csv_header)
        else:
            cur_row = row[:]
            if len(row[11]) > 10:         
                article_type, bibtex_key, dict = util.dict_from_string(row[11])
                for k in exclude_keys:
                    if k.lower() in dict:
                        dict.pop(k.lower())
                bibtex_dict = {bibtex_key: dict}
                bibtex_str = util.format_bibtex_str(
                    bibtex_dict, article_type=article_type)
                cur_row[11] = bibtex_str
            out_rows.append(cur_row)
        line += 1

with open(out_file_path, 'w') as outfile:
    csvwriter = csv.writer(outfile)
    csvwriter.writerows(out_rows)
