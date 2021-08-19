## Neural Fields in Visual Computing&mdash;Complementary Webpage

This is based on the extremely useful <a href="https://mini-conf.github.io/index.html">MiniConf</a> project for a virtual conference in a box from [Hendrik Strobelt](http://twitter.com/hen_str) and [Sasha Rush](http://twitter.com/srush_nlp)&mdash;thank you!


### Citation
When the paper comes out, please cite:
```bibtex
@misc{xxx,
    title={xxx},
    author={xxx},
    year={xxx},
    eprint={xxx},
    archivePrefix={xxx},
    primaryClass={xxx}
}
```

## Adding a paper&mdash;How To

- Fork the repo.
- Add your paper to the *datastore* in <a href="https://github.com/brownvc/neural-fields-review/tree/main/sitedata">`sitedata/`</a>, within the papers.csv file. Make a new row, and create a *unique* ID. Include all information where possible.
- Create a pull request.

## Website Team&mdash;Get Started on Development

<pre>
> pip install -r requirements.txt
> make run
</pre>

When you are ready to deploy run `make freeze` to get a static version of the site in the `build` folder. 

### Deploying to Github

- Define two command-line variables `GH_TOKEN` and `GH_REF`. `GH_TOKEN` is your Github personal access token, and will look like `username:token`. `GH_REF` is the location of this repo, e.g., ```export GH_REF=github.com/brownvc/neural-fields-review```.
- Execute `make deploy`. 
- That's it. The page is now (live here)[https://brownvc.github.io/neural-fields-review/].

### Tour

The <a href="https://github.com/brownvc/neural-fields-review">repo</a> contains:

1) *Datastore* <a href="https://github.com/brownvc/neural-fields-review/tree/main/sitedata">`sitedata/`</a>

Collection of CSV files representing the papers, speakers, workshops, and other important information for the conference.

2) *Routing* <a href="https://github.com/brownvc/neural-fields-review/tree/main/main.py">`main.py`</a>

One file flask-server handles simple data preprocessing and site navigation. 

3) *Templates* <a href="https://github.com/brownvc/neural-fields-review/tree/main/templates">`templates/`</a>

Contains all the pages for the site. See `base.html` for the master page and `components.html` for core components.

4) *Frontend* <a href="https://github.com/brownvc/neural-fields-review/tree/main/static">`static/`</a>

Contains frontend components like the default css, images, and javascript libs.

5) *Scripts* <a href="https://github.com/brownvc/neural-fields-review/tree/main/scripts">`scripts/`</a>

Contains additional preprocessing to add visualizations, recommendations, schedules to the conference. 

6) For importing calendars as schedule see [scripts/README_Schedule.md](https://github.com/brownvc/neural-fields-review/tree/main/scripts/README_Schedule.md)

### Extensions

MiniConf is designed to be a completely static solution. However it is designed to integrate well with dynamic third-party solutions. We directly support the following providers: 

* Rocket.Chat: The `chat/` directory contains descriptions for setting up a hosted Rocket.Chat instance and for embedding chat rooms on individual paper pages. You can either buy a hosted setting from Rocket.chat or we include instructions for running your own scalable instance through sloppy.io. 

* Auth0 : The code can integrate through Auth0.com to provide both page login (through javascript gating) and OAuth SSO with Rocket Chat. The documentation on Auth0 is very easy to follow, you simply need to create an Application for both the MiniConf site and the Rocket.Chat server. You then enter in the Client keys to the appropriate configs. 

* SlidesLive: It is easy to embedded any video provider -> YouTube, Vimeo, etc. However we have had great experience with SlidesLive and recommend them as a host. We include a slideslive example on the main page. 

* PDF.js: For conferences that use posters it is easy to include an embedded pdf on poster pages. An example is given. 


### Acknowledgements

More things here.


