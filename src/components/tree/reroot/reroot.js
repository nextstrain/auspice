/*
move flip node pair to move root from parent to node
     ----a  	  	----a
 ----|newRoot	 	|newRoot
 |   ---b 		 	|---b
 |oldRoot		-> 	|
 |				 	|----oldRoot----e
 -----e

 */
const flipNode = (node, parent) => {
	// should assert that node is child of parent
	parent.children = parent.children.filter((d) -> {return d!==node;});

	node.children.push(parent);
	parent.parent = node;
	node.parent = undefined;

	//flip branch length
	parent.branchLength = node.branchLength;
	node.branchLength = undefined;

	//flip mutations
	parent.muts = node.muts.forEach((m) => {
		return m[m.length-1] + m.substring(1,m.length-1) + m[0];
	});
	node.mutations = undefined;
	for (gene in node.aa_muts){
		parent.aa_muts[gene] = node.aa_muts[gene].forEach((m) => {
			return m[m.length-1] + m.substring(1,m.length-1) + m[0];
		});
		parent.aa_muts[gene] = undefined;
	}
}

/*
Add a node that is a new root node between parent and node
 */
const addNewRoot = (node, parent, branchSplit=0.5) => {
	// should assert that 1) node is child of parent and 2) that parent is root
	const newNode = {};
	for (let key in node){
		newNode[key] = node[key];
	}
	newNode.strain = node.strain + '_root';
	newNode.children = [node, parent];
	newNode.branchLength = undefined;
	node.branchLength = branchSplit*node.branchLength;
	parent.branchLength = (1-branchSplit)*node.branchLength;
	parent.children = parent.children.filter((d) => {return d!==node;});
	// DO SOMETHING WITH MUTATIONS
}

/*
remove node if it has only one child. Such nodes arise when the
previous root was bifurcating. Upon rerooting this bifurcating
node turns into a single-child node.
 */
const bridgeNode = (node) => {
	if (node.children.length===1) {
		node.parent.branchLength += node.branchLength;
		node.parent.muts = node.parent.muts.concat(node.muts);
		for (gene in aa_muts){
			node.parent.aa_muts[gene] = node.parent.aa_muts[gene].concat(node.aa_muts[gene]);
		}
		node.children[0].parent = node.parent;
		node.parent.children = node.parent.children((d) -> {return d!==node;});
		node.parent.children.push(node.children[0]);
	}
}

/*
change the root of the tree from node oldRoot to node newRoot
 */
const reroot = (newRoot, oldRoot) => {
	// determine the chain of nodes connecting the new to old root.
	const pathToOldRoot = [newRoot];
	let tmpNode = newRoot;
	while (tmpNode!==oldRoot){
		tmpNode = tmpNode.parent;
		pathToOldRoot.push(tmpNode);
	}

	// starting at the old root, move the root along the chain towards
	// the new root. The last node in the chain (newRoot) is treated separately
	for (let i=pathToOldRoot.length-1; i>0; i--){
		flipNode(pathToOldRoot[i-1], pathToOldRoot[i]);
	}

	// introduce new node above newRoot.
	const plength = pathToOldRoot.length;
	addNewRoot(pathToOldRoot[plength-2], pathToOldRoot[plength-1]);

	// remove redundant node if previous root was bifurcating
	bridgeNode(oldRoot);
}
