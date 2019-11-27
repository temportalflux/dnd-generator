
function copyTextToClipboard(html)
{
	// Create an iframe (isolated container) for the HTML
  var container = document.createElement('div');
  container.innerHTML = html;
  
  // Hide element
  container.style.position = 'fixed';
  container.style.pointerEvents = 'none';
	container.style.opacity = 0;
	
  // Mount the iframe to the DOM to make `contentWindow` available
  document.body.appendChild(container);

	// Clear all selected nodes
  window.getSelection().removeAllRanges();
  
  // Add the container as the only selected node
  var range = document.createRange();
  range.selectNode(container);
  window.getSelection().addRange(range);

  // Copy selected nodes to clipboard
	try
	{
		document.execCommand('copy');
	}
	catch (err)
	{
		console.error(err);
	}
  
  // Remove the iframe
  document.body.removeChild(container);
}

module.exports = copyTextToClipboard;