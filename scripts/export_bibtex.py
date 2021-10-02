import csv
import util
from bibtexparser.bparser import BibTexParser


class Bibtex():
    def __init__(self, str):
        self.str = str.strip(" \n\t")
        self.bibtex = self.dict_from_string(self.str)

    @staticmethod
    def dict_from_string(str):
        assert str[0] == "@"
        type = str[1 : str.find("{")]
        # For each bibtex key, make it a
        parser = BibTexParser()
        dict = parser.parse(str).get_entry_dict()
        name = dict.keys()[0]
        return type, name, dict[name]

def export_from_spreadsheet(input_fname, input_ext, output_fname="references.bib"):
    bibtex = []
    reader = util.read_spreadsheet(input_fname, input_ext)

    cnt = 0
    for row in reader:
        if cnt == 0:
            cnt += 1
            continue
        if len(row[11]) > 10:
            bibtex.append(row[11].replace("\r\n", "\n")+"\n\n")

    with open(output_fname, "w+", encoding="utf-8") as f:
        f.writelines(bibtex)


def format_dotbib_file(fname):
    with open(fname, 'r') as file:
        data = file.read()

    # Add new line between two citations
    data = data.replace("\n\n\n@", "\n@").replace("\n\n@", "\n@").replace("\n@", "\n\n@")
    data = data[data.find("@"):]
    data = data.split("\n\n@")
    print("{} bibtex citations found in {}.".format(len(data), fname))

    formatted = []
    for d in data:
        formatted.append(util.format_bibtex_str(d))

    formatted = "\n\n@".join(formatted)

    with open(fname, "w") as file:
        file.write(formatted)


if __name__ == "__main__":
    # input_fname = "Review Paper Import Portal Responses - Form Responses 1"
    # input_ext = ".csv"
    input_fname = "Review Paper Import Portal Responses"
    # input_fname = "output_responses"
    input_ext = ".xlsx"

    export_from_spreadsheet(input_fname, input_ext)

    dotbib_fname = "more_ref.bib"
    format_dotbib_file(dotbib_fname)
