import csv

stops = ['Caching',
        'Articulated',
        'Volume partitioning',
        'Segmentation/composition',
        'Challenging materials(fur, hair, transparency)',
         'Challenging materials',
        'Per-instance fine-tuning',
        'Learning residual',
        'Feature volume',
        'Segmentation',
        'fur',
        'hair',
        'transparency']

newrows = []
with open("../sitedata/papers.csv", "r") as infile:
    reader = csv.reader(infile)
    # i = 0
    for row in reader:
        newrow = []
        # i += 1
        # print(i)
        # print(row[16])
        keywords = row[16].split(",")
        #print(keywords)
        for keyword in keywords:
            if keyword:
                keyword = keyword.strip()
                add_this_flag = True
                for stop in stops:
                    if stop.strip().lower() in keyword.strip().lower():
                        add_this_flag = False
                        #print(keyword)
                if add_this_flag == True:
                    newrow.append(keyword)
                    print(keyword)
        
        # for word in row[0].split(","):
        #     if len(word) >= 3:
        #         print(word)
        #         addFlag = True
        #         for stopword in stop:
        #             if stopword.strip() in word.strip():
        #                 addFlag = False
        #                 break
        #         if addFlag and word and 'ff' not in word:
        #             newrow.append(word.strip())
        # for word in row[1].split(","):
        #     if len(word) >= 3:
        #         addFlag = True
        #         for stopword in stop:
        #             if stopword.strip() in word.strip():
        #                 addFlag = False
        #                 break
        #         if addFlag and word and 'ff' not in word :
        #             newrow.append(word.strip())
        #print(newrow)
        newrows.append([", ".join(newrow)])

print(len(newrows))
with open("outform.csv", 'w') as outfile:
    writer = csv.writer(outfile)
    writer.writerows(newrows)
