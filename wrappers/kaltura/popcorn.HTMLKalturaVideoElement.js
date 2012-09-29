/**
 * Kaltura player api HTML5 element wrapper.  
 * 
 * Based on the kaltura player API for more info see: 
 * http://html5video.org/kaltura-player/docs/
 */

(function( Popcorn, window, document ) {

var
EMPTY_STRING = '';

// Some default sizes: 
MIN_WIDTH = 300,
MIN_HEIGHT = 200;
	
  function HTMLKalturaVideoElement( id, options ) {
    var self = this,
      parent = typeof id === "string" ? Popcorn.dom.find( id ) : id,
      elem,
      impl = {
        src: EMPTY_STRING,
        networkState: self.NETWORK_EMPTY,
        readyState: self.HAVE_NOTHING,
        seeking: false,
        preload: EMPTY_STRING,
        controls: false,
        loop: false,
        poster: EMPTY_STRING,
        volume: 1,
        muted: 0,
        currentTime: 0,
        duration: NaN,
        ended: false,
        paused: true,
        width: parent.width|0   ? parent.width  : MIN_WIDTH,
        height: parent.height|0 ? parent.height : MIN_HEIGHT,
        error: null
      },
      kdp,
      playerReady = false,
      playerUID = Popcorn.guid(),
      playerReadyCallbacks = [],
      timeUpdateInterval,
      currentTimeInterval,
      kWidget; // kWidget is injected into this scope once lazy loaded

     // set the player options: 
    self._options = options || {},
    // Namespace all events we'll produce
    self._eventNamespace = Popcorn.guid( "HTMLKalturaVideoElement::" );

    self.parentNode = parent;

    // Mark type as Vimeo
    self._util.type = "Kaltura";

    // play method
    self.play = function() {
      if( !playerReady ) {
        addPlayerReadyCallback( function() { self.play(); } );
        return;
      }
      kdp.sendNotification('doPlay');
    };


    function changeSrc( aSrc ) {
      // Load the kWidget library ( if not already set ) 
      if( !window.kWidget ){
    	 // replace in an embedIframeJs url if kWidgetUrl is not set
    	 var src = options.kWidgetUrl || 
    	 	aSrc.replace( 'index.php\/kwidget\/cache_st\/[^\]*/wid/', 'p/')
    	 	.replace( 'uiconf_id\/', 'embedIframeJs/uiconf_id/' )
    	 Popcorn.getScript( src, function(){
    		 if( !window.kWidget ){
    			 if ( typeof console !== "undefined" && console.warn ) {
    			        console.warn( "Error could not load kWidget to embed kaltura player" );
    			 }
    			 return ;
    		 }
    		 // Update the local instance:
    		 kWidget = window.kWidget;
    		 // kWidget should now be defined re-call changeSrc
    		 changeSrc( aSrc );
    	 });
    	 return ;
      }
     
      // Get embed settings: 
      var embedSettings = kWidget.getEmbedSettings( aSrc,  self._options['flashvars'] || {} );
      if( !embedSettings.wid || !embedSettings.uiconf_id  ) {
        impl.error = {
          name: "MediaError",
          message: "Media Source Not Supported",
          code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        };
        self.dispatchEvent( "error" );
        return;
      }
      // update the pseudo src:
      impl.src = aSrc;

      // if the player is already ready just change media
      if( playerReady ) {
        console.log( 'put changeMedia call here' );
        return;
      }

      playerReady = false;

      embedSettings.readyCallback = function( playerId ){
    	 // grab kdp object:
    	kdp = document.getElementById( playerId );
    	
    	// Once media is ready to be played trigger associated events
    	kdp.kBind( 'mediaReady', function(){
    		playerReady = true;
    		// clear out all impl values that we should better get
    		// from the player its self. 
    		var implClearList = [ "autoplay", "volume", "currentTime" ];
    		for( var i=0;i < implClearList.length; i++ ){
    			var attr = implClearList[i];
    			// send everything back to the player if it was updated
    			self[ attr ] = implClearList[i];
    			impl[ implClearList[i] ] = null;
    		}
    	})
    	
    	// Add media bindings:
    	kdp.kBind( 'playerPlayEnd', function(){
          if( impl.loop ) {
	        changeCurrentTime( 0 );
	        self.play();
	      } else {
	        impl.ended = true;
	        self.dispatchEvent( "ended" );
	      }
        })
      }
      elem = document.createElement( 'div' );
      elem.style.margin = 'auto';
      elem.style.display = 'block';
      elem.id = playerUID;
      elem.width = impl.width;
      elem.height = impl.height;
      parent.appendChild( elem );
      
      // copy over any impl props: 
      embedSettings.width = impl.width;
      embedSettings.height = impl.height;
      kWidget.embed( playerUID, embedSettings );
    }
    
    Object.defineProperties( self, {
      src: {
        get: function() {
          return impl.src;
        },
        set: function( aSrc ) {
          if( aSrc && aSrc !== impl.src ) {
            changeSrc( aSrc );
          }
        }
      },

      autoplay: {
        get: function() {
          return impl.autoplay || kdp.evaluate('{autoPlay}');
        },
        set: function( aValue ) {
          impl.autoplay = self._util.isAttributeSet( aValue );
        }
      },

      loop: {
        get: function() {
          return impl.loop;
        },
        set: function( aValue ) {
          impl.loop = self._util.isAttributeSet( aValue );
        }
      },

      width: {
        get: function() {
          return elem.width;
        },
        set: function( aValue ) {
          impl.width = aValue;
        }
      },

      height: {
        get: function() {
          return elem.height;
        },
        set: function( aValue ) {
          impl.height = aValue;
        }
      },

      currentTime: {
        get: function() {
          return impl.currentTime || kdp.evaluate('{video.player.currentTime}');
        },
        set: function( aValue ) {
          if( playerReady ){
        	  var perc = aValue / self.duration;
        	  kdp.sendNotification( 'doSeek', perc );
          } else {
        	  impl.currentTime = aValue;
          }
        }
      },

      duration: {
        get: function() {
          return impl.duration || kdp.evaluate( '{duration}' );
        }
      },

      ended: {
        get: function() {
          return impl.ended;
        }
      },

      paused: {
        get: function() {
          return impl.paused;
        }
      },

      seeking: {
        get: function() {
          return impl.seeking;
        }
      },

      readyState: {
        get: function() {
          return impl.readyState;
        }
      },

      networkState: {
        get: function() {
          return impl.networkState;
        }
      },

      volume: {
        get: function() {
          return impl.volume || kdp.evaluate( '{video.volume}' );
        },
        set: function( aValue ) {
          if( aValue < 0 || aValue > 1 ) {
            throw "Volume value must be between 0.0 and 1.0";
          }
          if( playerReady ){
        	kdp.sendNotification( 'changeVolume', aValue );
          } else {
        	impl.volume = aValue;
          }
        }
      },

      muted: {
        get: function() {
          return getMuted();
        },
        set: function( aValue ) {
          setMuted( self._util.isAttributeSet( aValue ) );
        }
      },

      error: {
        get: function() {
          return impl.error;
        }
      }
    });
  }

  HTMLKalturaVideoElement.prototype = new Popcorn._MediaElementProto();
  HTMLKalturaVideoElement.prototype.constructor = HTMLKalturaVideoElement;

  // Helper for identifying URLs we know how to play.
  HTMLKalturaVideoElement.prototype._canPlaySrc = function( url ) {
    return /wid|uiconf_id/.test( url ) ? "probably" : EMPTY_STRING;
  };

  // We'll attempt to support a mime type of video/x-vimeo
  HTMLKalturaVideoElement.prototype.canPlayType = function( type ) {
    return type === "video/x-vimeo" ? "probably" : EMPTY_STRING;
  };

  Popcorn.HTMLKalturaVideoElement = function( id, options ) {
    return new HTMLKalturaVideoElement( id, options );
  };
  Popcorn.HTMLKalturaVideoElement._canPlaySrc = HTMLKalturaVideoElement.prototype._canPlaySrc;

}( Popcorn, window, document ));
