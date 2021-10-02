overwrite_existing = True


# If the venue is not ARXIV, then remove month from ARXIV API
if row.find("(") > 0:
    venue_ = row[:row.find("(")]
venue = venue_.strip(" 0123456789")
venue_year = venue_.strip(" ")

# Add year to bibtex
# Format bibtex (indent, capitalize, Last, First -> First Last, etc.)


# Replace bibtex key (api agnostic)

# Update bibtex key in row

# Get author from bibtex (api agnostic)

# Get abstract form bibtex (api agnostic)
