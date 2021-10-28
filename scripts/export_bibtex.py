import csv
import util
from util import csv_head_key


def export_from_spreadsheet(input_fname, input_ext, output_fname="temp/references.bib", exclude_keys=[]):
    bibtex = []
    reader = util.read_spreadsheet(input_fname, input_ext)

    cnt = 0
    for row in reader:
        if cnt == 0:
            cnt += 1
            continue
        if len(row[csv_head_key['Bibtex']]) > 10:
            article_type, bibtex_key, dict = util.dict_from_string(row[csv_head_key['Bibtex']])
            for k in exclude_keys:
                if k.lower() in dict:
                    dict.pop(k.lower())
            bibtex_dict = {bibtex_key : dict}
            bibtex_str = util.format_bibtex_str(bibtex_dict, article_type=article_type, exclude_keys=exclude_keys)
            bibtex.append(bibtex_str+"\n\n")

    with open(output_fname, "w+", encoding="utf-8") as f:
        f.writelines(bibtex)


def format_dotbib_file(fname, exclude_keys=[]):
    with open(fname, 'r') as file:
        data = file.read()

    # Add new line between two citations
    data = data.replace("\n\n\n@", "\n@").replace("\n\n@", "\n@").replace("\n@", "\n\n@")
    data = data[data.find("@"):]
    data = data.split("\n\n@")
    data[0] = data[0][1:]
    print("{} bibtex citations found in {}.".format(len(data), fname))

    bibtex = []
    for d in data:
        d = "@"+d
        article_type, bibtex_key, dict = util.dict_from_string(d)
        for k in exclude_keys:
            if k.lower() in dict:
                dict.pop(k.lower())
        bibtex_dict = {bibtex_key : dict}
        bibtex_str = util.format_bibtex_str(bibtex_dict, article_type=article_type)
        bibtex.append(bibtex_str+"\n\n")

    with open(fname, "w+", encoding="utf-8") as f:
        f.writelines(bibtex)


if __name__ == "__main__":
    # input_fname = "Review Paper Import Portal Responses - Form Responses 1"
    # input_ext = ".csv"
    # input_fname = "Review Paper Import Portal Responses"
    # input_fname = "output_responses"
    # input_fname = "Neural Fields_ Paper Import Portal (Responses)"
    # input_ext = ".xlsx"
    input_fname = "sitedata/papers"
    input_ext = ".csv"
    exclude_keys = [
        "NOTE",
        "ID",
        "ENTRYTYPE",
        "EPRINT",
        "ARCHIVEPREFIX",
        "PRIMARYCLASS",
        "FILE",
        "ABSTRACT",
        # "URL",
    ]
    export_from_spreadsheet(input_fname, input_ext, exclude_keys=exclude_keys)

    dotbib_fname = "temp/more_ref.bib"
    format_dotbib_file(dotbib_fname, exclude_keys=exclude_keys)


"""
arxiv:
@article{deprelle2019learning,
  AUTHOR = {Theo Deprelle and Thibault Groueix and Matthew Fisher and Vladimir G. Kim and Bryan C. Russell and Mathieu Aubry},
  TITLE = {Learning elementary structures for 3D shape generation and matching},
  EPRINT = {1908.04725v2},
  ARCHIVEPREFIX = {arXiv},
  PRIMARYCLASS = {cs.CV},
  ABSTRACT = {We propose to represent shapes as the deformation and combination oflearnable elementary 3D structures, which are primitives resulting fromtraining over a collection of shape. We demonstrate that the learned elementary3D structures lead to clear improvements in 3D shape generation and matching.More precisely, we present two complementary approaches for learning elementarystructures: (i) patch deformation learning and (ii) point translation learning.Both approaches can be extended to abstract structures of higher dimensions forimproved results. We evaluate our method on two tasks: reconstructing ShapeNetobjects and estimating dense correspondences between human scans (FAUST interchallenge). We show 16% improvement over surface deformation approaches forshape reconstruction and outperform FAUST inter challenge state of the art by6%.},
  YEAR = {2019},
  MONTH = {Aug},
  URL = {http://arxiv.org/abs/1908.04725v2},
  FILE = {1908.04725v2.pdf}
 }

The CVF: ICCV, ECCV, CVPR
@inproceedings{OechsleICCV2019,
    title = {Texture Fields: Learning Texture Representations in Function Space},
    author = {Oechsle, Michael and Mescheder,Lars and Niemeyer, Michael and Strauss, Thilo and Geiger, Andreas},
    booktitle = {Proceedings IEEE International Conf. on Computer Vision (ICCV)},
    year = {2019}
}

ACM ToG:
@article{10.1145/3414685.3417879,
author = {Zheng, Quan and Babaei, Vahid and Wetzstein, Gordon and Seidel, Hans-Peter and Zwicker, Matthias and Singh, Gurprit},
title = {Neural Light Field 3D Printing},
year = {2020},
issue_date = {December 2020},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
volume = {39},
number = {6},
issn = {0730-0301},
url = {https://doi.org/10.1145/3414685.3417879},
doi = {10.1145/3414685.3417879},
abstract = {Modern 3D printers are capable of printing large-size light-field displays at high-resolutions.
However, optimizing such displays in full 3D volume for a given light-field imagery
is still a challenging task. Existing light field displays optimize over relatively
small resolutions using a few co-planar layers in a 2.5D fashion to keep the problem
tractable. In this paper, we propose a novel end-to-end optimization approach that
encodes input light field imagery as a continuous-space implicit representation in
a neural network. This allows fabricating high-resolution, attenuation-based volumetric
displays that exhibit the target light fields. In addition, we incorporate the physical
constraints of the material to the optimization such that the result can be printed
in practice. Our simulation experiments demonstrate that our approach brings significant
visual quality improvement compared to the multilayer and uniform grid-based approaches.
We validate our simulations with fabricated prototypes and demonstrate that our pipeline
is flexible enough to allow fabrications of both planar and non-planar displays.},
journal = {ACM Trans. Graph.},
month = nov,
articleno = {207},
numpages = {12},
keywords = {volumetric display, light field, neural networks, 3D printing, computational fabrication}
}

NeurIPS:
@inproceedings{NEURIPS2020_0004d0b5,
 author = {Ok, Seongmin},
 booktitle = {Advances in Neural Information Processing Systems},
 editor = {H. Larochelle and M. Ranzato and R. Hadsell and M. F. Balcan and H. Lin},
 pages = {1--12},
 publisher = {Curran Associates, Inc.},
 title = {A graph similarity for deep learning},
 url = {https://proceedings.neurips.cc/paper/2020/file/0004d0b59e19461ff126e3a08a814c33-Paper.pdf},
 volume = {33},
 year = {2020}
}

TPAMI:
@ARTICLE{9416824,
  author={Shen, Siyuan and Wang, Zi and Liu, Ping and Pan, Zhengqing and Li, Ruiqian and Gao, Tian and Li, Shiying and Yu, Jingyi},
  journal={IEEE Transactions on Pattern Analysis and Machine Intelligence},
  title={Non-line-of-Sight Imaging via Neural Transient Fields},
  year={2021},
  volume={43},
  number={7},
  pages={2257-2268},
  doi={10.1109/TPAMI.2021.3076062}
}

ICLR:
@inproceedings{
horv{\'a}th2021a,
title={A Better Alternative to Error Feedback for Communication-Efficient Distributed Learning},
author={Samuel Horv{\'a}th and Peter Richtarik},
booktitle={International Conference on Learning Representations},
year={2021},
url={https://openreview.net/forum?id=vYVI1CHPaQg}
}

IJCAI:
@inproceedings{ijcai2021-495,
  title     = {Electrocardio Panorama: Synthesizing New ECG views with Self-supervision},
  author    = {Chen, Jintai and Zheng, Xiangshang and Yu, Hongyun and Chen, Danny Z. and Wu, Jian},
  booktitle = {Proceedings of the Thirtieth International Joint Conference on
               Artificial Intelligence, {IJCAI-21}},
  publisher = {International Joint Conferences on Artificial Intelligence Organization},
  editor    = {Zhi-Hua Zhou},
  pages     = {3597--3605},
  year      = {2021},
  month     = {8},
  note      = {Main Track}
  doi       = {10.24963/ijcai.2021/495},
  url       = {https://doi.org/10.24963/ijcai.2021/495},
}

EGSR:
@article{neff2021donerf,
  journal = {Computer Graphics Forum},
  title = {{DONeRF: Towards Real-Time Rendering of Compact Neural Radiance Fields using Depth Oracle Networks}},
  author = {Neff, Thomas and Stadlbauer, Pascal and Parger, Mathias and Kurz, Andreas and Mueller, Joerg H. and Chaitanya, Chakravarty R. Alla and Kaplanyan, Anton S. and Steinberger, Markus},
  year = {2021},
  publisher = {The Eurographics Association and John Wiley & Sons Ltd.},
  ISSN = {1467-8659},
  DOI = {10.1111/cgf.14340},
  url = {https://doi.org/10.1111/cgf.14340},
  volume = {40},
  number = {4},
}
"""
