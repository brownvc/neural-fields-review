class API {
	/**
	 * get and cache config object
	 * @return object
	 */
	static getConfig() {
		if (API.configCache == null) {
			API.configCache = $.get("serve_config.json");
		}
		return API.configCache;
	}


	static getPapers() {
		if (API.paperCache == null) {
			API.paperCache = $.get("papers.json");
		}
		return API.paperCache;
	}

	static getCitationGraphData() {
		if (API.citationGraphDataCache == null) {
			API.citationGraphDataCache = $.get("serve_citation_graph.json");
		}
		return API.citationGraphDataCache;
	}

	static getPapersAndProjection() {
		return Promise.all([
			API.getPapers(),
			$.get("serve_papers_projection.json"),
		]);
	}

	/**
	 * lazy store creation/loading - not needed if own store backend
	 * @see API.storeIDs
	 * @return object
	 */
	static getStore(storeID) {
		if (!(storeID in API._storeCaches)) {
			API._storeCaches[storeID] = new Persistor(
				`miniconf-${API.getConfig().name}-${storeID}`
			);
		}
		return API._storeCaches[storeID];
	}

	/**
	 * get marks for all papers of a specific type
	 * @see API.storeIDs
	 * @param storeID
	 * @return {Promise<object>}
	 */
	static async markGetAll(storeID) {
		return API.getStore(storeID).getAll();
	}

	static async markSet(storeID, paperID, read = true) {
		return API.getStore(storeID).set(paperID, read);
	}

	/*
	 * Resource paths
	 */

	/**
	 * Link to thumbnails derived from paper object
	 * @param paper
	 * @return {string}
	 */
	static thumbnailPath(paper) {
		return `thumbnail_${paper.UID}.png`;
	}

	/**
	 * Link to paper detail
	 * @param paper
	 * @return {string}
	 */
	static paperLink(paper) {
		return `paper_${paper.UID}.html`;
	}
}

API.configCache = null;
API.paperCache = null;
API.citationGraphDataCache = null;
API._storeCaches = {};
API.storeIDs = {
	visited: "visited",
	bookmarked: "bookmark",
};
