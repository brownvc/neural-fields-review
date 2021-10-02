## Usage (For Yiheng)
Step 1: Download the google form as .xlsx file

Step 2: Run scripts
```
rm *Zone.Identifier
python arxiv_api.py
mv output_responses.xlsx "Review Paper Import Portal Responses.xlsx"
rm *Zone.Identifier
python scholarly_api.py
python spreadsheet_check_error.py
mv checked.xlsx "Review Paper Import Portal Responses.xlsx"
rm *Zone.Identifier
python export_bibtex.py
```

Step 4: Update the following columns when copying to google sheets
- Date
- Citation
- Venue
- Authors
- Bibtex Name
- Abstract (Maybe no)
- Citation Count

Step 5: generate sitedata/paper.csv
- `python database2miniconf.py`

Step 6: make deploy

Step 7: Update `references.bib` in Overleaf

## Note on citation conventions and generation
Minimally, the keys should be: AUTHOR, TITLE, BOOKTITLE, YEAR,
Our format should have keys: AUTHOR, TITLE, YEAR, MONTH, URL, JOURNAL

BOOKTITLE = {
        "ARXIV": "ArXiv Pre-print",
        "CVPR": Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)
        "ICCV": "Proceedings of the IEEE International Conference on Computer Vision (ICCV)"
        "ECCV": "Proceedings of the European Conference on Computer Vision (ECCV)",
        "NeurIPS": "Advances in Neural Information Processing Systems (NeurIPS)",
        "3DV": "International Conference on 3D Vision" (3DV),
        "ICML": "International Conference on Machine Learning (ICML)",
        "SIGGRAPH Asia":
        "CoRL": "Proceedings of the Conference on Robot Learning (CoRL)"
        "ICLR": "International Conference on Learning Representations",
        "IJCAI": "Proceedings of the Thirtieth International Joint Conference on Artificial Intelligence (IJCAI)"
        "GRAPHITE04": "International Conference on Computer Graphics and Interactive Techniques in Australasia and South East Asia",
        "Journal of Physics: Conference Series": "Journal of Physics: Conference Series",
        "RSS": "Proceedings of Robotics: Science and Systems",
        "EGSR":
}
JOURNAL = {
    "ToG": "ACM Transactions on Graphics (TOG)",
    "TPAMI": "IEEE Transactions on Pattern Analysis and Machine Intelligence",
    "EGSR": "Computer Graphics Forum",

}
"ACM Transactions on Graphics (Proceedings of SIGGRAPH ASIA)"
MONTH = {
    "PAML": "Jul",
    "CVPR 2020": "Jun",
    "CVPR 2021": "Jun",
    "TPAMI 2021": "Jul",
    "ICCV 2020": "Jun",
    "ICCV 2021": "Oct",
    "CoRL 2020": "Nov",
    "SIGGRAPH 2020": "Nov",
    "SIGGRAPH 2021": "Jul",
    "RSS 2021": "Jul",
    "IJCAI 2021": "Aug",
}
PUBLISHER = {
    "ToG" = "Association for Computing Machinery (ACM)",
    "NeurIPS": "Curran Associates, Inc.",
    "ICML": "PMLR",
    "SIGGRAPH": "Association for Computing Machinery",
    "Journal of Physics: Conference Series": "IOP Publishing",
    "IJCAI": "International Joint Conferences on Artificial Intelligence Organization",
    "EGSR": "The Eurographics Association and John Wiley & Sons Ltd.",

}
ORGANIZATION = {
        "ICML": "PMLR",
}
TYPE = {
    "PAML": "article",
    "CVPR": "inproceedings",
    "ICCV": "inproceedings",
    "ECCV": "inproceedings",
    "NeurIPS": "inproceedings",
    "3DV": "inproceedings",
    "ICML": "inproceedings",
    "ICLR": "inproceedings",
    "RSS": "inproceedings",
    "IJCAI": "inproceedings",
    "SIGGRAPH": "article",
    "TPAMI": "article",
    "EGSR": "article"
}
arxiv:
"""
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
"""
The CVF: ICCV, ECCV, CVPR
"""
@inproceedings{OechsleICCV2019,
    title = {Texture Fields: Learning Texture Representations in Function Space},
    author = {Oechsle, Michael and Mescheder,Lars and Niemeyer, Michael and Strauss, Thilo and Geiger, Andreas},
    booktitle = {Proceedings IEEE International Conf. on Computer Vision (ICCV)},
    year = {2019}
}
"""
ACM ToG:
"""
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
"""
NeurIPS:
"""
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
"""
TPAMI:
"""
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
"""
ICLR:
"""
@inproceedings{
horv{\'a}th2021a,
title={A Better Alternative to Error Feedback for Communication-Efficient Distributed Learning},
author={Samuel Horv{\'a}th and Peter Richtarik},
booktitle={International Conference on Learning Representations},
year={2021},
url={https://openreview.net/forum?id=vYVI1CHPaQg}
}
"""
IJCAI:
"""
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
"""
EGSR:
"""
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
