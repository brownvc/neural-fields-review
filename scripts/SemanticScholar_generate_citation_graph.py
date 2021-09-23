import requests
import csv
import json
import time


def get_paper_id(title):
    url = 'https://api.semanticscholar.org/graph/v1/paper/search?'
    params = dict(
        query=title
    )
    resp = requests.get(url=url, params=params)
    data = resp.json()
    try:
        if data["total"] > 0:
            return data["data"][0]["paperId"]
    except:
        print(data)
        pass


def get_titles_of_papers_citing_this(title):
    paperID = get_paper_id(title)
    titles_citing_this = []

    if paperID is not None:
        url = f'https://api.semanticscholar.org/graph/v1/paper/{paperID}/citations?fields=title'
        resp = requests.get(url=url)
        data = resp.json()
        try:
            for citingPaper in data["data"]:
                titles_citing_this.append(
                    citingPaper["citingPaper"]["title"].strip())
        except:
            print(data)
            pass

    return titles_citing_this


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
    if (i+1) % 90 == 0:
        print("Sleep for 2 mins to change IP address...")
        num_minutes = 0
        while num_minutes < 2:
            time.sleep(64)
            num_minutes += 1
            print(f"Slept {num_minutes} minute(s), zzz...")

        print("I'm awake!")

    print(
        f"Checking paper {i} / {len(titles)}, found {num_citations} citation relations")
    cur_id = title2id[title]
    papers_citing_this = get_titles_of_papers_citing_this(title)
    for paper_citing_this in papers_citing_this:
        paper_citing_this = paper_citing_this.strip()
        if paper_citing_this in titles:
            id_of_paper_citing_this = title2id[paper_citing_this]
            graph[id_of_paper_citing_this]["out_edge"].append(cur_id)
            graph[cur_id]["in_edge"].append(id_of_paper_citing_this)
            num_citations += 1


print(f"Found ${num_citations} citation relations.")

our_file_path = "../sitedata/citation_graph.json"
with open(our_file_path, "w") as outfile:
    json.dump(graph, outfile)
