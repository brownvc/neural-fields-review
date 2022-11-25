

# Adding papers to the website:

### First, copy the new entries (lines) from google sheets to csv file

```bash
export GH_TOKEN=<your_alias>:<github_token>
export GH_REF=github.com/brownvc/neural-fields-review
python scripts/run_api.py
python scripts/spreadsheet_check_error.py
mv temp/checked.csv sitedata/papers.csv
rm sitedata/*.Zone.Identifier
git add -A
git commit -m "routine"
git push
make deploy
```

If the above method does not work, try this:
```bash
export GH_REF=github.com/brownvc/neural-fields-review
python scripts/run_api.py
python scripts/spreadsheet_check_error.py
mv temp/checked.csv sitedata/papers.csv
rm sitedata/*.Zone.Identifier
git add -A
git commit -m "routine"
git push
make deploy-2

```
