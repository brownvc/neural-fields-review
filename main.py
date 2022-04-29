# pylint: disable=global-statement,redefined-outer-name
import argparse
import csv
import glob
import json
import os
import re

import yaml
from flask import Flask, jsonify, redirect, render_template, send_from_directory
from flask_frozen import Freezer
from flaskext.markdown import Markdown
from os.path import exists

site_data = {}
by_uid = {}

field_name_mapping = {
    "Title": "Title",
    "Nickname": "Nickname (e.g. DeepSDF)",
    "Venue": "Venue no Year",
    "Date": "Date released",
    "Citation": "Bibtex (e.g. @inproceedings...)",
    "PDF": "PDF link (arXiv perferred)",
    "Project Webpage": "Project webpage link",
    "Code Release": "Code Release (Github link, or enter \"Coming soon\")",
    "Data Release": "Data Release (link)",
    "Talk/Video": "Talk/Video (link, Youtube preferred)",
    "Keywords": "Keywords",
    "Abstract": "Abstract",
    "UID": "UID",
    "Authors": "Authors (format: First Last, First Middle Last, ...)",
    "Year": 'Year (corresponding to venue e.g. released in 2021, accepted to CVPR 2022, then put "2022" for this entry, and "2021" for the above)'
}

def main(site_data_path):
    global site_data, extra_files
    extra_files = ["README.md"]
    # Load all for your sitedata one time.
    for f in glob.glob(site_data_path + "/*"):
        if not os.path.isdir(f):
            extra_files.append(f)
            name, typ = f.split("/")[-1].split(".")
            if typ == "json":
                site_data[name] = json.load(open(f))
            elif typ in {"csv", "tsv"}:
                site_data[name] = list(csv.DictReader(open(f)))
            elif typ == "yml":
                site_data[name] = yaml.load(open(f).read(), Loader=yaml.SafeLoader)

    for typ in ["papers"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p

    print("Data Successfully Loaded")
    return extra_files


# ------------- SERVER CODE -------------------->

app = Flask(__name__)
app.config.from_object(__name__)
freezer = Freezer(app)
markdown = Markdown(app)

def _data():
    data = {}
    data["config"] = site_data["config"]
    return data

def extract_comma_seperated_field(v, key):
    value = v.get(key, "")
    if "Keywords" in key:
        #keywords may be in form '(apple, banana)', so we don't simply split by ',' here
        result = []
        seenOpenParentheses = False
        tmpStr = ""
        for char in value:
            if char == "(":
                seenOpenParentheses = True
                tmpStr += "("
            elif char == "," and seenOpenParentheses == False:
                result.append(tmpStr.strip())
                tmpStr = ""
            elif char == ")":
                seenOpenParentheses = False
                tmpStr += ")"
            else:
                tmpStr += char
        if tmpStr:
            result.append(tmpStr.strip())
        return result
    else:
        if len(value) > 0:
            result = value.split(",")
            for i in range(len(result)):
                result[i] = result[i].strip()
        else:
            result = []
    return result


def embed_url(video_url):
    regex = r"(?:https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)"
    return re.sub(regex, r"https://www.youtube.com/embed/\1", video_url)


def format_paper(v):
    list_keys = ["Authors", "Keywords"]
    list_fields = {}
    for key in list_keys:
        list_fields[key] = extract_comma_seperated_field(v, field_name_mapping[key])

    talk_URLs = v[field_name_mapping["Talk/Video"]].split(',')
    talk_URL = ""
    for URL in talk_URLs:
        if "youtube" in URL:
            if "embed" in URL:
                talk_URL = URL
            else:
                talk_URL = embed_url(URL)
        else:
            talk_URL = URL

    data = {
        "UID": v[field_name_mapping["UID"]],
        "title": v[field_name_mapping["Title"]],
        "nickname": v[field_name_mapping["Nickname"]],
        "authors": list_fields["Authors"],
        #"Tasks": list_fields["Task"],
        #"Techniques": list_fields["Techniques"],
        "keywords": list_fields["Keywords"],
        "date": v[field_name_mapping["Date"]],
        "abstract": v[field_name_mapping["Abstract"]],
        "pdf_url": v.get(field_name_mapping["PDF"], ""),
        "code_link": v.get(field_name_mapping["Code Release"], ""),
        "data_link": v.get(field_name_mapping["Data Release"], ""),
        "talk_link": talk_URL,
        "project_link": v[field_name_mapping["Project Webpage"]],
        "citation": v[field_name_mapping["Citation"]],
        "venue": v.get(field_name_mapping["Venue"], ""),
        "year": v[field_name_mapping["Year"]],
    }
    return data


@app.route("/")
def index():
    return redirect("/index.html")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(site_data_path, "favicon.ico")


@app.route("/index.html")
def home():
    data = _data()
    return render_template("index.html", **data)

@app.route("/papers.html")
def papers():
    data = _data()
    data["papers"] = site_data["papers"]
    return render_template("papers.html", **data)


@app.route("/papers_vague.html")
def papers_vague():
    data = _data()
    data["papers"] = site_data["papers"]
    return render_template("papers_vague.html", **data)


@app.route("/paper_vis_timeline.html")
def paper_vis_timeline():
    data = _data()
    return render_template("papers_vis_timeline.html", **data)


@app.route("/paper_vis_citation_graph.html")
def paper_vis_citation_graph():
    data = _data()
    return render_template("papers_vis_citation_graph.html", **data)


@app.route("/paper_vis_statistics.html")
def paper_vis_statistics():
    data = _data()
    return render_template("papers_vis_statistics.html", **data)

@app.route("/paper_<paper>.html")
def paper(paper):
    uid = paper
    v = by_uid["papers"][uid]
    data = _data()
    data["paper"] = format_paper(v)
    return render_template("paper_detail.html", **data)

@app.route("/faq.html")
def info():
    data = _data()
    return render_template("faq.html", **data)

@app.route("/add_paper.html")
def add_paper():
    data = _data()
    return render_template("add_paper.html", **data)

@app.route("/join_us.html")
def contributors():
    data = _data()
    return render_template("join_us.html", **data)

@app.route("/thumbnail_<thumbnail>.png")
def thumbnail(thumbnail):
    uid = thumbnail
    if exists(f'{site_data_path}/thumbnails/UID_{uid}.png'):
        return send_from_directory(f'{site_data_path}/thumbnails', f'UID_{uid}.png')
    else:
        return send_from_directory(f'{site_data_path}/thumbnails', 'no_thumbnail_available.png')



# FRONT END SERVING

@app.route("/papers.json")
def paper_json():
    json = []
    for v in site_data["papers"]:
        json.append(format_paper(v))
    return jsonify(json)

@app.route("/serve_<path>.json")
def serve(path):
    return jsonify(site_data[path])


# --------------- DRIVER CODE -------------------------->
# Code to turn it all static


@freezer.register_generator
def generator():
    for paper in site_data["papers"]:
        # yield "thumbnail", {"thumbnail": str(paper["UID"])}
        yield "paper", {"paper": str(paper["UID"])}

    for key in site_data:
        yield "serve", {"path": key}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="MiniConf Portal Command Line")

    parser.add_argument(
        "--build",
        action="store_true",
        default=False,
        help="Convert the site to static assets",
    )

    parser.add_argument(
        "-b",
        action="store_true",
        default=False,
        dest="build",
        help="Convert the site to static assets",
    )

    parser.add_argument(
        "path", help="Pass the JSON data path and run the server")

    args = parser.parse_args()
    return args


if __name__ == "__main__":
    args = parse_arguments()

    site_data_path = args.path
    extra_files = main(site_data_path)

    if args.build:
        freezer.freeze()
    else:
        debug_val = False
        if os.getenv("FLASK_DEBUG") == "True":
            debug_val = True

        app.run(port=5000, debug=debug_val, extra_files=extra_files)
