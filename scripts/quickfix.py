import csv, xlsxwriter, openpyxl
import feedparser, urllib, urllib.request
from arxiv2bib import arxiv2bib
from util import *
import unidecode
from tqdm import tqdm
import copy

# @profile
input_fname = "sitedata/papers"
input_ext = ".csv"
output_fname = "sitedata/papers_"
output_ext = ".csv"

# Load spreadsheet
rows = read_spreadsheet(input_fname, input_ext)

for r in tqdm(range(1, len(rows))):
    row = rows[r]

    # Replace words
    prev = copy.deepcopy(row[csv_head_key['Keywords']])
    row[csv_head_key['Keywords']] = row[csv_head_key['Keywords']] \
        .replace('Dynamic', 'Dynamic/Temporal') \
        .replace('Image', '2D Image Neural Fields') \
        .replace('Beyond Visual Computing, ', '') \
        .replace(', Beyond Visual Computing', '') \
        .replace('Coordinate Re-mapping, ', '') \
        .replace(', Coordinate Re-mapping', '') \
        .replace('Speed (Training)', 'Speed & Computational Efficiency') \
        .replace('Speed (Rendering)', 'Speed & Computational Efficiency') \
        .replace('Speed & Computational Efficiency, Speed & Computational Efficiency', 'Speed & Computational Efficiency') \
        .replace('2D Image Neural Fields-based Rendering', 'Image-Based Rendering')

    if (row[17] not in ["", "None"]) and ((not ('SIREN' in row[17])) and (not ('NeRF' in row[17]))):
        print(row[17])
        row[csv_head_key['Keywords']] += ', Positional Encoding'

    if row[csv_head_key['Keywords']] != prev:
        print(r)
        print(prev)
        print(row[csv_head_key['Keywords']])

write_spreadsheet(rows, output_fname, output_ext)
