## Usage
Download the google form as .xlsx file

python arxiv_api.py
python scholarly_api.py
python spreadsheet_check_error.py

Update the following columns
- Date
- Citation
- Venue
- Authors
- Bibtex Name
- Abstract (Maybe no)
- Citation Count

Check miss-spelling
- Authors
- Bibtex Name

## Original miniconf README.md
This directory contains extensions to help support the mini-conf library.

These include:

* `embeddings.py` : For turning abstracts into embeddings. Creates an `embeddings.torch` file.

```bash
python embeddings.py ../sitedata/papers.csv
```

* `reduce.py` : For creating two-dimensional representations of the embeddings.

```bash
python reduce.py ../sitedata/papers.csv embeddings.torch > ../sitedata/papers_projection.json
```

* `parse_calendar.py` : to convert a local or remote ICS file to JSON. -- more on importing calendars see [README_Schedule.md](README_Schedule.md)

```bash
python parse_calendar.py --in sample_cal.ics
```

* Image-Extraction: https://github.com/Mini-Conf/image-extraction for pulling images from PDF files.
