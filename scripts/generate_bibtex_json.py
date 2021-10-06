import csv
import util
import json

papers_file_path = "../sitedata/papers.csv"
out_file_path = "../sitedata/paperID2bibtex.json"
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
id2bibtex = dict()

with open(papers_file_path) as csv_file:
    line = 0
    csv_reader = csv.reader(csv_file, delimiter=',')
    for row in csv_reader:
        if line != 0 and len(row[11]) > 10:
            article_type, bibtex_key, dict = util.dict_from_string(row[11])
            for k in exclude_keys:
                if k.lower() in dict:
                    dict.pop(k.lower())
            bibtex_dict = {bibtex_key: dict}
            bibtex_str = util.format_bibtex_str(bibtex_dict, article_type=article_type)

            paperID = row[29]
            id2bibtex[paperID] = bibtex_str
        line += 1

with open(out_file_path, "w", encoding="utf-8") as outfile:
    json.dump(id2bibtex, outfile, indent=2, separators=(',', ':'))
