from util import *
from tqdm import tqdm
from unidecode import unidecode
import re


with open("temp/ref.txt", 'r') as file:
    latex_references_section = file.read()

latex_references_section = latex_references_section.lower()
latex_references_section = re.sub(r'[^A-Za-z0-9 ]+', '', latex_references_section)
latex_references_section = latex_references_section.replace(" ","")
# s = re.sub(r'[^A-Za-z0-9 ]+', '', unidecode("PIFu: Pixel-Aligned Implicit Function for High-Resolution Clothed Human Digitization".lower())) in latex_references_section
# print(s)
# exit(12)

input_fname = "sitedata/papers"
input_ext = ".csv"
output_fname_cited = "temp/cited"
output_fname_not = "temp/not_cited"
output_ext = ".xlsx"

print(latex_references_section)
# exit(12)
# Load spreadsheet
rows = read_spreadsheet(input_fname, input_ext)
for r in rows:
    r[7] = r[16]

rows_cited, rows_not = [rows[0][3:]], [rows[0][3:]]
for r in tqdm(rows[1:]):
    if re.sub(r'[^A-Za-z0-9 ]+', '', unidecode(r[3]).lower()).strip(" .").replace(" ","") in latex_references_section:
    # if unidecode(r[3]).lower() in latex_references_section:
        rows_cited.append(r[3:])
    else:
        rows_not.append(r[3:])

write_spreadsheet(rows_cited, output_fname_cited, output_ext)
write_spreadsheet(rows_not, output_fname_not, output_ext)


print("not_cited/cited/total: {}/{}/{}".format(len(rows_not)-1, len(rows_cited)-1, len(rows)-1))
