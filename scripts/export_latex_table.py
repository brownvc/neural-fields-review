from util import *

keywords = [
'Speed (Training)',
'Speed (Rendering)',
'Sparse Reconstruction',
'Dynamic',
'Human (Body)',
'Human (Head)',
'Robotics',
'Image',
'Camera Parameter Estimation',
'Material/Lighting Estimation',
'Editable',
'Compression',
'Alternative Imaging',
'Science & Engineering',
'Fundamentals',
'Generative Models',
'Generalization',
'Global Conditioning',
'Local Conditioning',
'Image-based Rendering',
'Hypernetwork/Meta-learning',
'Hybrid Geometry Parameterization',
'Voxel Grid',
'Object-Centric',
'Sampling',
'Supervision by Gradient (PDE)',
'Coarse-to-Fine',
'Coordinate Re-mapping'
]

input_fname = "sitedata/papers"
input_ext = ".csv"
output_fname = "temp/appendix_all_works.tex"
rotate_90 = False
replace_keywords = True

# Load spreadsheet
rows = read_spreadsheet(input_fname, input_ext)
entries = 2 + len(keywords)

# List of list. First list index corresponds to csv row
payload = []
for r in rows[1:50]:
    title = [r[4]] if len(r[4])>1 else [r[26].split(", ")[0].split(" ")[-1] + " et al."]
    citation = [f"\cite{{{r[27]}}}"]
    checkmark = []
    for k in keywords:
        if k.lower() in r[16].lower():
            checkmark.append("\checkmark")
        else:
            checkmark.append(" ")
    line = title + citation + checkmark
    line = " & ".join(line)
    assert line.count("&") == (entries - 1)
    payload.append(line)
print("cols, rows", len(keywords)+2, len(payload)+1)
payload = "\\\\\n".join(payload) + "\\\\\n"

# l_s = "l l " + " ".join(["l" for _ in range(len(keywords))])
l_s = "|p{2.2cm}|p{1.7cm}|" + "|".join(["p{0.04cm}" for _ in range(len(keywords))]) + "|"
# l_s = "|" + "|".join(["p{1cm}" for _ in range(len(keywords))]) + "|"
# l_s = "c c " + " ".join(["c" for _ in range(len(keywords))])

caption = "Tabulated keywords for all neural fields papers. "
if replace_keywords:
    caption += "Keyword lookup: "
    caption += ", ".join(["{}: {}".format(i, keywords[i].replace("&", "\\&")) for i in range(len(keywords))])
    caption += "."


first_line = " & ".join([f"\\multicolumn{{1}}{{|c|}}{{\\textbf{{Title}}}}", f"\\multicolumn{{1}}{{|c|}}{{\\textbf{{Citation}}}}"]+[f"\\multicolumn{{1}}{{|c|}}{{{k}}}" for k in range(len(keywords))])
# \\label{{tab:appendix_all_works}}
head = f"""
\\newpage
\\onecolumn
\\begin{{longtable}}[c]{{{l_s}}}
\\caption{{{caption}}}\\\\

\\hline
{first_line}
\\hline
\\endfirsthead

\\multicolumn{{{len(keywords)+2}}}{{c}}%
{{{{{caption}}}}} \\\\
\\hline
{first_line}
\\endhead

\\hline \\multicolumn{{{len(keywords)+2}}}{{|r|}}{{Continued on next page}} \\\\ \\hline
\\endfoot
"""#.format(l_s)
# \\toprule
# \\centering
# \\begin{{adjustbox}}{{max width=\\textwidth}}
# \\begin{{tabular}}{{{l_s}}}
# if replace_keywords:
#     titles = ["Title", "Citation"] + [str(_) for _ in range(len(keywords))]
# else:
#     titles = ["Title", "Citation"] + keywords
#
# titles = " & ".join(titles) + "\\\\\n"
# assert titles.count("&") == (entries - 1)

# \\end{{tabular}}
# \\end{{adjustbox}}
# \\bottomrule
tail = f"""
\\vspace{{-0.25cm}}
\\end{{longtable}}
"""

# header
# final_str = head + header + payload + tail
final_str = head + payload + tail
print(final_str)
if rotate_90:
    final_str = "\\begin{{adjustbox}}{{angle=90}}\n" + final_str + "\n\\end{{adjustbox}}"

with open(output_fname, "w+", encoding="utf-8") as f:
    f.write(final_str)
