import csv


def export_from_spreadsheet(input_fname, input_ext, output_fname="references.bib"):
    bibtex = []
    reader = read_spreadsheet(input_fname, input_ext):

    for row in reader:
        if cnt == 0:
            cnt += 1
            continue
        bibtex.append(row[11].replace("\r\n", "\n")+"\n\n")

    with open(output_fname, "w+", encoding="utf-8") as f:
        f.writelines(bibtex)


if __name__ == "__main__":
    # input_fname = "Review Paper Import Portal Responses - Form Responses 1"
    # input_ext = ".csv"
    input_fname = "Review Paper Import Portal Responses"
    input_ext = ".xlsx"

    export_from_spreadsheet(input_fname, input_ext)
