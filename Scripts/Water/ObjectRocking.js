  var ObjectRocking = pc.createScript('objectRocking');                                                                                                                                 
                                                                                                                                                                                        
  ObjectRocking.attributes.add('waveSpeed', { type: 'number', default: 1.5 });                                                                                                          
  ObjectRocking.attributes.add('waveFrequency', { type: 'number', default: 3000.0 });                                                                                                    
  ObjectRocking.attributes.add('rockAngle', { type: 'number', default: 1.0 });                                                                                                          
  ObjectRocking.attributes.add('bobHeight', { type: 'number', default: 0.02 });                                                                                                         
                                                                                                                                                                                        
  ObjectRocking.prototype.initialize = function() {                                                                                                                                     
      this.time = 0;                                                                                                                                                                    
      this.startPos = this.entity.getLocalPosition().clone();                                                                                                                           
      this.startRot = this.entity.getLocalEulerAngles().clone();                                                                                                                        
  };                                                                                                                                                                                    
                                                                                                                                                                                        
  ObjectRocking.prototype.update = function(dt) {                                                                                                                                       
      this.time += dt * this.waveSpeed;                                                                                                                                                 
                                                                                                                                                                                        
      var pos = this.entity.getLocalPosition();                                                                                                                                         
      var x = pos.x * 0.01;                                                                                                                                    
      var z = pos.z * 0.02;                                                                                                                                                             
                                                                                                                                                                                        
      var rollWave = Math.sin(x * this.waveFrequency + this.time) * this.rockAngle;                                                                                                     
      var pitchWave = Math.sin(z * this.waveFrequency * 0.9 + this.time * 0.8) * this.rockAngle * 0.6;                                                                                  
                                                                                                                                                                                        
      var bobWave = Math.sin(x * this.waveFrequency + this.time) * this.bobHeight;                                                                                                      
      bobWave += Math.sin(z * this.waveFrequency * 0.9 + this.time * 0.8) * this.bobHeight * 0.6;                                                                                       
                                                                                                                                                                                        
      this.entity.setLocalEulerAngles(                                                                                                                                                  
          this.startRot.x + pitchWave,                                                                                                                                                  
          this.startRot.y,                                                                                                                                                              
          this.startRot.z + rollWave                                                                                                                                                    
      );                                                                                                                                                                                
                                                                                                                                                                                        
      this.entity.setLocalPosition(                                                                                                                                                     
          this.startPos.x,                                                                                                                                                              
          this.startPos.y + bobWave,                                                                                                                                                    
          this.startPos.z                                                                                                                                                               
      );                                                                                                                                                                                
  }; 