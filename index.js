module.exports = (function () {

	'use strict';

	function replaceArrWith(arrNodes, newNode) {

		var newNodes;
		if( newNode instanceof DocumentFragment ){
			newNodes = [].slice.apply(newNode.childNodes);
		}

		// Replace first
		var oldNode = arrNodes.shift();
			oldNode.parentNode.replaceChild(newNode, oldNode);

		// Unrender
		while( oldNode = arrNodes.shift() ){
			oldNode.parentNode.removeChild(oldNode);
		}

		[].push.apply(arrNodes, newNodes ? newNodes : [newNode]);
	}


	function generateSetGet(commentNode) {

		// Inherit these methods instead!
		var methods = {
			nodes: [commentNode],
			addClass: null,
			removeClass: null,
			text: function(str) {
				replaceArrWith(this.nodes, document.createTextNode(str));
			},
			html: function(str){
				replaceArrWith(this.nodes, renderHTML([], str));
			},
			place: function(templateObj){
				replaceArrWith(this.nodes, templateObj.createDocumentFragment());
			}
		};

		return {
			set: function(value) {
				if( value instanceof Patterns ){
					methods.place(value);
				}else{
					methods.text(value);	
				}
			},
			get: function() { return methods; }
		};
	}


	// Replace with domify?
	function renderHTML(arr, str) {

		var	$fragment = document.createDocumentFragment(),
			$container = document.createElement("div");
			$container.innerHTML = str;

		while( $container.firstChild ){
			arr.push( $fragment.appendChild( $container.removeChild( $container.firstChild ) ) );
		}
		
		return $fragment;
	}



	function Patterns(template) {

		// Strip all comments

		// Convert handlebars to comments
		template = template.replace(/{{/g, '<!--').replace(/}}/g, '-->').replace(/^\s+|\s+$/g, '');

		// Optimize later so Im not applying but just refering this?
		var frag = renderHTML(this, template),
			fragTree = document.createTreeWalker(frag, NodeFilter.SHOW_COMMENT);

		while( fragTree.nextNode() ){
			Object.defineProperty(
				this,
				fragTree.currentNode.nodeValue,			// Label in comment
				generateSetGet(fragTree.currentNode)	// Methods to replace the comment placeholder DOM with
			);
		}
	}

	Patterns.prototype = Object.create(Array.prototype);

	Patterns.prototype.createDocumentFragment = function createDocumentFragment() {

		var frag = document.createDocumentFragment();

		for( var i = 0, len = this.length; i < len; i++ ){
			frag.appendChild(this[i]);
		}

		return frag;
	};

	Patterns.prototype.appendTo = function appendTo(dom) {
		dom.appendChild( this.createDocumentFragment() );
	};


	return function (html){ return (new Patterns(html)); }
})();

/*
var htmlStr1 = `
<table>
	<thead>{{tableHeader}}</thead>
	<tbody>{{tableBody}}</tbody>
</table>
`;

htmlStr1 = `
<section>
	<div class="title">{{title}}</div>
	<div class="body">{{body}}</div>
</section>
`;

var testObj1 = Patterns(htmlStr1);
var testObj2 = Patterns(htmlStr1);

testObj1.appendTo(document.body);



// Changing the text
testObj1.title = 'New title';
testObj1.body = 'Nesw Body';
testObj1.body.html("hello <a href='http://google.com'>Google</a>");



testObj1.body.place(testObj2);
testObj2.title = 'nested title!';
testObj2.body = 'nested body';


*/