"""
Use package scholarly (https://scholarly.readthedocs.io/en/stable/)
to get the following information:
- Authors
- Bibtex citation
- Citedby (count)
Stuff it's not good at:
- Abstract (often truncated)
- Venue (often truncated)
This is especially useful if the paper is not on ArXiv.
"""
import csv, xlsxwriter, openpyxl
from util import *
import unidecode
from tqdm import tqdm

capitalize_bibtex_keys = "ALL"

# Spreadsheet input/output names
input_fname = "Review Paper Import Portal Responses"
input_ext = ".xlsx"
output_fname = "output_responses"
output_ext = ".xlsx"
input_fname.replace(".csv", " - Form Responses 1.csv")
output_fname.replace(".csv", " - Form Responses 1.csv")

# Load spreadsheet
rows_in = read_spreadsheet(input_fname, input_ext)
rows_out = []

# Iterate on each row
cnt = 0
for row in tqdm(rows_in):
    if (cnt == 0):
        rows_out.append(row)
        cnt += 1
        continue

    search_result = None
    # Bibtex
    if (row[11] == ""):
        search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
        try:
            bibtex_str = format_bibtex_str(scholarly.bibtex(search_result), cap_keys=capitalize_bibtex_keys)
            row[11] = bibtex_str
        except Exception as e:
            print(e)

    # Bibtex name (same code as arxiv_api.py)
    if (row[28] == ""):
        if (row[11] != ""):
            row[11] = row[11].replace("\r\n", "\n")
            start, end = row[11].find("{") + 1, row[11].find(",")
            name = row[11][start:end]
            row[28] = name.lower()
            print(cnt, name)


    # Citations count
    if (row[31] == ""):
        search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
        try:
            citations = search_result['num_citations']
            row[31] = citations
            print(cnt, "citations count: ", row[31])
        except Exception as e:
            print(e)

    # Authors
    if row[27] == "":
        search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
        try:
            if (row[11] != ""):
                authors = ", ".join(get_authors_from_bibtex(bibtex_str))
                row[27] = authors
        except Exception as e:
            print(e)

    # Venue
    if row[23] == "":
        search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
        venue = get_venue(search_result['bib']['venue'], search_result['bib']['pub_year'])
        try:
            if not (("..." in search_result['bib']['venue']) or ("…" in search_result['bib']['venue'])):
                print(search_result['bib']['venue'])
                venue = get_venue(search_result['bib']['venue'], search_result['bib']['pub_year'])
                row[23] = venue
        except Exception as e:
            print(e)

    # Abstract
    if row[30] == "":
        search_result = get_scholarly_result(row[1]) if (search_result is None) else search_result
        try:
            abstract = search_result['bib']['abstract']
            if len(abstract) > 20:
                row[30] = abstract
        except Exception as e:
            print(e)

    rows_out.append(row)
    print(row)
    break

write_spreadsheet(rows_out, output_fname, output_ext)


"""
Testing/exploration code...
"""

    # print(search_result['num_citations'])
    # 366

    # print(search_result['bib'])
    # {'title': 'Nerf: Representing scenes as neural radiance fields for view synthesis',
    # 'author': ['B Mildenhall', 'PP Srinivasan', 'M Tancik'], 'pub_year': '2020', 'venue': 'European conference on …',
    # 'abstract': 'We present a method that achieves state-of-the-art results for synthesizing novel views of complex scenes by optimizing an underlying continuous volumetric scene function using a sparse set of input views. Our algorithm represents a scene using a fully-connected (non-convolutional) deep network, whose input is a single continuous 5D coordinate (spatial location (x, y, z) and viewing direction (θ, ϕ)) and whose output is the volume density and view-dependent emitted radiance at that spatial location. We synthesize views by querying'}

    # print(scholarly.bibtex(search_result))
    # dict_keys(['title', 'author', 'pub_year', 'venue', 'abstract', 'pages', 'booktitle', 'ENTRYTYPE', 'ID'])

    # print(search_result['bib'].keys())
    # @inproceedings{peng20043d,
    #  abstract = {3D object reconstruction is frequent used in various fields such as product design, engineering, medical and artistic applications. Numerous reconstruction techniques and software were introduced and developed. However, the purpose of this paper is to fully integrate an adaptive artificial neural network (ANN) based method in reconstructing and representing 3D objects. This study explores the ability of neural networks in learning through experience when reconstructing an object by estimating it's z-coordinate. Neural},
    #  author = {Peng, Lim Wen and Shamsuddin, Siti Mariyam},
    #  booktitle = {Proceedings of the 2nd international conference on Computer graphics and interactive techniques in Australasia and South East Asia},
    #  pages = {139--147},
    #  pub_year = {2004},
    #  title = {3D object reconstruction and representation using neural networks},
    #  venue = {… of the 2nd international conference on …}
    # }

    # print(search_result['bib']['venue'])
    # … of the 2nd international conference on …

    # Generates a list of bibtex for all papers that cites this paper
    # cited_by = [citation['bib'] for citation in scholarly.citedby(search_result)]
    # cited_by = [citation['bib']['title'] for citation in scholarly.citedby(search_result)]
