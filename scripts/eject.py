import csv

stop = ['Caching'
        'Articulated'
        'Volume partitioning'
        'Segmentation/composition'
        'Challenging materials(fur, hair, transparency)'
        'Per-instance fine-tuning'
        'Learning residual'
        'Feature volume'
        'Segmentation'
        'fur',
        'hair',
        'transparency']

newrows = []
with open("form.csv", "r") as infile:
    reader = csv.reader(infile)
    for row in reader:
        newrow = []
        for word in row[0].split(","):
            if len(word) >= 3:
                addFlag = True
                for stopword in stop:
                    if stopword.strip() in word.strip():
                        addFlag = False
                        break
                if addFlag and word and 'ff' not in word:
                    newrow.append(word.strip())
        for word in row[1].split(","):
            if len(word) >= 3:
                addFlag = True
                for stopword in stop:
                    if stopword.strip() in word.strip():
                        addFlag = False
                        break
                if addFlag and word and 'ff' not in word :
                    newrow.append(word.strip())
        #print(newrow)
        newrows.append([", ".join(newrow)])

print(len(newrows))
with open("outform.csv", 'w') as outfile:
    writer = csv.writer(outfile)
    writer.writerows(newrows)
