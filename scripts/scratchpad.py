import unidecode
import csv
import feedparser, urllib
from util import *


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

for k in names:
    print(unidecode.unidecode(names[k]))

input_fname = "Review Paper Import Portal Responses"
ext = ".xlsx"   # ".csv"
input_fname += ext
rows_in = read_spreadsheet(input_fname, ext)
input_fname.replace(".csv", " - Form Responses 1.csv")

rows_in = read_spreadsheet(input_fname, ext)

cnt = 0
for row in rows_in:
    # If paper is on arxiv
    if ("https://arxiv.org/pdf/" in row[4]):
        # Get data from arxiv api
        id = row[4][22:32]
        url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
        data = urllib.request.urlopen(url)
        d = feedparser.parse(data.read().decode('utf-8'))
        # print(d['entries'][0].keys())
        # print(d['entries'][0]['author_detail'])
        print(d['entries'][0]['published'])
        # print(d['entries'][0]['published_parsed'])
        # print(d['entries'][0]['title_detail'])
        # print(d['entries'][0]['summary'])
        # print(d['entries'][0]['summary_detail'])
        if 'arxiv_comment' in d['entries'][0].keys():
            print(d['entries'][0]['arxiv_comment'])
        # print(d['entries'][0]['links'])
        # print(d['entries'][0]['tags'])
        # if cnt > 10:
        #     exit(12)
        cnt += 1
