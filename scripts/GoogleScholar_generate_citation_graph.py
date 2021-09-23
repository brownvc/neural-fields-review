# This script works, but google doesn't like robot... So we cannot use this script without proxy
from scholarly import scholarly
import csv
import json
import time


def get_names_of_papers_citing_this(paper_name):
    search_query = scholarly.search_pubs(paper_name)
    print("Sending request to google...")
    pub = scholarly.fill(next(search_query))
    print("Heard back from google!")
    try:
        return [citation['bib']['title'] for citation in scholarly.citedby(pub)]
    except:
        return []


papers_file_path = "../sitedata/papers.csv"
title2id = dict()
titles = set()
graph = dict()

with open(papers_file_path) as csv_file:
    line = 0
    csv_reader = csv.reader(csv_file, delimiter=',')
    for row in csv_reader:
        if line != 0:
            title, id = row[1], row[29]
            titles.add(title.strip())
            title2id[title] = id
            graph[id] = {
                "in_edge": [],
                "out_edge": []
            }
        line += 1

num_citations = 0
for i, title in enumerate(titles):
    print(
        f"Checking paper {i} / {len(titles)}, found {num_citations} citation relations")
    cur_id = title2id[title]
    papers_citing_this = get_names_of_papers_citing_this(title)
    for paper_citing_this in papers_citing_this:
        paper_citing_this = paper_citing_this.strip()
        if paper_citing_this in titles:
            id_of_paper_citing_this = title2id[paper_citing_this]
            graph[id_of_paper_citing_this]["out_edge"].append(cur_id)
            graph[cur_id]["in_edge"].append(id_of_paper_citing_this)
            num_citations += 1
    if (i+1) % 5 == 0:
        print("Sleep for 3 secs to pretend I'm not a robot...")
        time.sleep(3)
        print("I'm awake!")

print(f"Found ${num_citations} citation relations.")

our_file_path = "../sitedata/citation_graph.json"
with open(our_file_path, "w") as outfile:
    json.dump(graph, outfile)
