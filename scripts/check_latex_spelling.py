import argparse, os
# incorrect -> correct
corrections = {
    "pointcloud" : "point cloud",
    "Pointcloud" : "Point cloud",
    "voxelgrid" : "voxel grid",
    "Voxelgrid" : "Voxel grid",
    "levelset" : "level set",
    "Levelset" : "Level set",
    "ray-trac" : "raytrac", # ray-trac(ed|ing|er)
    "Ray-trac" : "Raytrac",
    "hyper-network" : "hypernetwork",
    "Hyper-network" : "Hypernetwork",
    "data-set" : "dataset",
    "Data-set" : "Dataset",
    "data set" : "dataset",
    "Data set" : "Dataset",
    "edit-able" : "editable",
    "Edit-able" : "Editable",
    "tri-linear" : "trilinear",
    "Tri-linear" : "Trilinear",
    "hyper-parameter" : "hyperparameter",
    "Hyper-parameter" : "Hyperparameter",
    "parametriz" : "parameteriz", # parameteriz(ing|ed)
    "Parametriz" : "Parameteriz",
    "underparameteriz" : "under-parameteriz",
    "Underparameteriz" : "Under-parameteriz",
    "overparameteriz" : "over-parameteriz",
    "Overparameteriz" : "Over-parameteriz",
    "auto-encod" : "autoencod", # auto-encod(er|ing|ed)
    "Auto-encod" : "Autoencod",
    "finetun" : "fine-tun", # fine-tun(ing|es)
    "Finetun" : "Fine-tun",
    "pytorch" : "PyTorch",
    "Pytorch" : "PyTorch",
    "tensorflow" : "TensorFlow",
    "Tensorflow" : "TensorFlow",
    "feedforward" : "feed-forward", # Based on 1994 paper IEEE
    "Feedforward" : "Feed-forward",
    "up-sampling": "upsampling",
    "backpropagat": "back-propagat",    # 1986 paper
    "Backpropagat": "Back-propagat",
    "realtime": "real-time",        # verified
}


warning = ['--']

excluded_filenames = [
    "macros.tex",
    "archived_tex",
    "fixed_tex",
]

def fix(text):
    for incorrect, correct in corrections.items():
        text = text.replace(incorrect, correct)
    return text

def fix_one_file(input_fname, output):
    print("Fixing one file: {} --> {}".format(input_fname, output))
    f = open(input_fname, mode='r')
    text = f.read()
    f.close()
    text = fix(text)
    if output:
        o = open(output, mode='w+', encoding="utf-8")
    else:
        o = open(input_fname, mode='w+', encoding="utf-8")
    o.write()
    o.close()


def fix_by_item(text, user_approval=True):
    no_fix = True
    for incorrect, correct in corrections.items():
        ind = 0
        find_ind = text[ind:].find(incorrect)
        lo = find_ind + ind
        hi = lo + len(incorrect)
        while find_ind >= 0:
            print(text[lo-30:lo] + "[" + text[lo:hi] + "]" + text[hi:hi+30:])
            print(text[lo-30:lo] + "[" + correct + "]" + text[hi:hi+30:])

            action = input('Enter your approval (enter/n/replacement):')
            if action == "":
                replacement = correct
                no_fix = False
            elif action == "n":
                replacement = incorrect
            else:
                replacement = action
                no_fix = False

            # Replace
            text = text[:lo] + replacement + text[hi:]
            hi = lo + len(replacement)
            # Find next
            ind = hi
            find_ind = text[ind:].find(incorrect)
            lo = find_ind + ind
            hi = lo + len(incorrect)
    return text, no_fix



if __name__ == "__main__":
    """
    Usage:
        python fix.py --output_dir fixed_tex --all --by_item --approval
    """
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=str)
    parser.add_argument('--output', type=str)
    parser.add_argument('--output_dir', type=str)
    parser.add_argument('--all', action="store_true", default=False)
    parser.add_argument('--by_item', action="store_true", default=False)
    parser.add_argument('--approval', action="store_true", default=False)
    args = parser.parse_args()

    if args.output_dir and (not os.path.exists(args.output_dir)):
        os.mkdir(args.output_dir)

    if args.all:
        listOfFiles = list()
        for (dirpath, dirnames, filenames) in os.walk("."):
            listOfFiles += [os.path.join(dirpath, file) for file in filenames]
        to_check = list()
        for input_fname in listOfFiles:
            add = True
            if (".tex" == input_fname[-4:]):
                for exclude in excluded_filenames:
                    if exclude in input_fname:
                        add = False
                if add: to_check.append(input_fname)
        print("Files to fix ({}): {}".format(len(to_check), "\n".join(to_check)))

        for input_fname in to_check:
            if args.output_dir:
                output = os.path.join(args.output_dir, os.path.basename(input_fname))
            else:
                output = input_fname

            if args.by_item:
                print("===================================")
                print("Fixing file by item: ", input_fname)
                with open(input_fname, mode='r') as f:
                    text = f.read()
                text, no_fix = fix_by_item(text, args.approval)
                if not no_fix:
                    with open(output, mode='w+', encoding="utf-8") as f:
                        f.write(text)
            else:
                fix_one_file(input_fname, output)
    else:
        if output_dir:
            output = os.path.join(output_dir, os.path.basename(input_fname))
        fix_one_file(input_fname, output)
