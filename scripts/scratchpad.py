import unidecode
import csv
import feedparser, urllib

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

csv_name = "Review Paper Import Portal Responses - Form Responses 1.csv"
# For bibtex: whether to use a more descriptive nickname (e.g. sitzmann2020siren)
replace_name = True

rows = []
with open(csv_name, newline='', encoding="utf-8") as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='"')
    cnt = 0
    print(reader)
    for row in reader:
        print(row)
        # If paper is on arxiv
        if ("https://arxiv.org/pdf/" in row[4]):
            # Get data from arxiv api
            id = row[4][22:32]
            url = 'http://export.arxiv.org/api/query?id_list={}&start=0&max_results=1'.format(id)
            data = urllib.request.urlopen(url)
            d = feedparser.parse(data.read().decode('utf-8'))
            print("?")
            print(d['entries'][0].keys())
            print(d['entries'][0]['author_detail'])
            print(d['entries'][0]['published'])
            print(d['entries'][0]['published_parsed'])
            print(d['entries'][0]['title_detail'])
            print(d['entries'][0]['summary'])
            print(d['entries'][0]['summary_detail'])
            exit(12)
            