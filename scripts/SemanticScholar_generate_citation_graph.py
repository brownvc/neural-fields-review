import requests
import csv
import json
import time
import os

smoke_test = False

papers_file_path = "../sitedata/papers.csv"
title2id = dict()
titles = set()
graph = dict()

out_file_path = "../sitedata/citation_graph.json"
paper_ids_already_processed = set()

token_path = "./SemanticScholarAuthKey.txt"
SemanticScholar_token = None

with open(token_path, "r") as token_file:
    SemanticScholar_token = token_file.read().strip()
    print("SemanticScholar auth token loaded: ", SemanticScholar_token)

def get_paper_id(title):
    url = 'https://api.semanticscholar.org/graph/v1/paper/search?'
    params = dict(
        query=title
    )
    resp = requests.get(url=url, params=params, headers={'x-api-key': SemanticScholar_token})
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
        resp = requests.get(url=url, headers={'x-api-key': SemanticScholar_token})
        data = resp.json()
        try:
            for citingPaper in data["data"]:
                titles_citing_this.append(
                    citingPaper["citingPaper"]["title"].strip())
        except:
            print(data)
            pass

    return titles_citing_this

if os.path.exists(out_file_path):
    with open(out_file_path, "r") as infile:
        currrent_citation_graph = json.load(infile)
        graph = currrent_citation_graph
        paper_ids_already_processed = set(currrent_citation_graph.keys())

with open(papers_file_path) as csv_file:
    line = 0
    csv_reader = csv.reader(csv_file, delimiter=',')
    for row in csv_reader:
        if line != 0:
            title, id = row[3], row[28]
            titles.add(title.strip())
            title2id[title] = id
            graph[id] = {
                "in_edge": set(),
                "out_edge": set()
            }
        line += 1

num_citations = 0
processed_papers = 0

for i, title in enumerate(titles):
    if smoke_test and i == 5:
        break
    # if (processed_papers+1) % 90 == 0:
    #     print("Sleep for 0.5 min to change IP address...")
    #     num_minutes = 0
    #     while num_minutes < 1:
    #         time.sleep(30)
    #         num_minutes += 1
    #         print(f"Slept {num_minutes} minute(s), zzz...")

    #     print("I'm awake!")

    print(
        f"Checking paper {i} / {len(titles)}, found {num_citations} citation relations")

    cur_id = title2id[title]

    if cur_id not in paper_ids_already_processed:
        papers_citing_this = get_titles_of_papers_citing_this(title)
        for paper_citing_this in papers_citing_this:
            paper_citing_this = paper_citing_this.strip()
            if paper_citing_this in titles:
                id_of_paper_citing_this = title2id[paper_citing_this]
                if cur_id != id_of_paper_citing_this:
                    graph[id_of_paper_citing_this]["out_edge"].add(cur_id)
                    graph[cur_id]["in_edge"].add(id_of_paper_citing_this)
                num_citations += 1
        processed_papers += 1


print(f"Found {num_citations} citation relations.")

for key in graph:
    graph[key]["in_edge"] = list(graph[key]["in_edge"])
    graph[key]["out_edge"] = list(graph[key]["out_edge"])

with open(out_file_path, "w") as outfile:
    json.dump(graph, outfile)
