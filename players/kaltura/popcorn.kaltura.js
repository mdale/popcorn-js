(function( window, Popcorn ) {

  Popcorn.player( "kaltura", {
    _canPlayType: function( nodeName, url ) {
      // Check for kWidget options based embed ( no url string ) 
      if( typeof url == null ){
        return true;
      }
      return ( typeof url === "string" && Popcorn.HTMLKalturaVideoElement._canPlaySrc( url ) );
    }
  });

  Popcorn.kaltura = function( container, url, options ) {
    if ( typeof console !== "undefined" && console.warn ) {
      console.warn( "Deprecated player 'kaltura'. Please use Popcorn.HTMLKalturaVideoElement directly." );
    }

    // Break spec; include options in Kaltura video element, so we can support embeding options
    var media = Popcorn.HTMLKalturaVideoElement( container, options ),
      popcorn = Popcorn( media, options );

    // Set the src "soon" but return popcorn instance first, so
    // the caller can get get error events.
    setTimeout( function() {
      media.src = url;
    }, 0 );
    
    return popcorn;
  };

}( window, Popcorn ));
