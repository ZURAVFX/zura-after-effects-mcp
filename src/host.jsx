/* Zura host dispatcher. ES3 only. Uses the currently open AE project. */
function __zuraJson(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return '"' + value.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/[\u0000-\u001f\u2028\u2029]/g,function(c){ var s=c.charCodeAt(0).toString(16); return "\\u"+"0000".substr(s.length)+s; }) + '"';
  if (typeof value === "number") return isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return String(value);
  var parts=[], key;
  if (value instanceof Array) { for(key=0;key<value.length;key++) parts.push(__zuraJson(value[key])); return "["+parts.join(",")+"]"; }
  for(key in value) if(value.hasOwnProperty(key)) parts.push(__zuraJson(key)+":"+__zuraJson(value[key]));
  return "{"+parts.join(",")+"}";
}
function __zuraItem(id) { for(var i=1;i<=app.project.numItems;i++) if(app.project.item(i).id===id) return app.project.item(i); throw Error("Item ID not found: "+id); }
function __zuraComp(id) { var c=id ? __zuraItem(id) : app.project.activeItem; if(!(c instanceof CompItem)) throw Error("Select a composition or supply its stable comp_id."); return c; }
function __zuraLayer(c,id) { for(var i=1;i<=c.numLayers;i++) if(c.layer(i).id===id) return c.layer(i); throw Error("Layer ID not found: "+id); }
function __zuraProperty(layer,path) { var p=layer; for(var i=0;i<path.length;i++) { p=p.property(path[i]); if(!p) throw Error("Property path not found at "+path[i]); } return p; }
function __zuraItemInfo(item) { var kind="folder";if(item instanceof CompItem)kind="composition";else if(item instanceof FootageItem)kind="footage";return {id:item.id,name:item.name,type:kind,width:item.width||null,height:item.height||null,duration:item.duration||null,frame_rate:item.frameRate||null}; }
function __zuraLayerInfo(l) { return {id:l.id,index:l.index,name:l.name,enabled:l.enabled,locked:l.locked,three_d:l.threeDLayer,parent_id:l.parent?l.parent.id:null,in_point:l.inPoint,out_point:l.outPoint,start_time:l.startTime,source_id:l.source?l.source.id:null}; }
function __zuraPropInfo(p) { var d={name:p.name,match_name:p.matchName,type:String(p.propertyType)}; if(p.propertyType===PropertyType.PROPERTY) { d.value_type=String(p.propertyValueType); d.num_keys=p.numKeys; d.can_expression=p.canSetExpression; if(p.propertyValueType!==PropertyValueType.NO_VALUE && p.propertyValueType!==PropertyValueType.CUSTOM_VALUE) { var v=p.value; d.value= v instanceof TextDocument ? {text:v.text,font:v.font,font_size:v.fontSize} : v instanceof Shape ? {vertices:v.vertices,in_tangents:v.inTangents,out_tangents:v.outTangents,closed:v.closed} : v; } } else d.num_properties=p.numProperties; return d; }
function __zuraDispatch(op,a) {
  var c,l,p,item,data={},verified=false,i;
  if(op==="get_project") { var items=[]; for(i=(a.offset||0)+1;i<=Math.min(app.project.numItems,(a.offset||0)+(a.limit||100));i++) items.push(__zuraItemInfo(app.project.item(i))); return {version:app.version,path:app.project.file?app.project.file.fsName:null,active_item:app.project.activeItem?__zuraItemInfo(app.project.activeItem):null,total_items:app.project.numItems,items:items}; }
  if(op==="list_effects") { var effects=[]; for(i=a.offset||0;i<Math.min(app.effects.length,(a.offset||0)+(a.limit||100));i++) effects.push({display_name:app.effects[i].displayName,match_name:app.effects[i].matchName,category:app.effects[i].category}); return {total:app.effects.length,effects:effects}; }
  if(op==="get_footage_interpretation" || op==="set_footage_frame_rate") { item=__zuraItem(a.item_id); if(!(item instanceof FootageItem))throw Error("Item is not footage.");if(op==="set_footage_frame_rate"){if(item.mainSource.isStill)throw Error("Still footage has no conform frame rate.");item.mainSource.conformFrameRate=a.frame_rate;}return {item_id:item.id,is_still:item.mainSource.isStill,frame_rate:item.frameRate,conform_frame_rate:item.mainSource.conformFrameRate,file:item.file?item.file.fsName:null,verified:op==="set_footage_frame_rate"&&Math.abs(item.mainSource.conformFrameRate-a.frame_rate)<0.001}; }
  if(op==="save_project") { var file=new File(a.path); if(file.exists && (!app.project.file || app.project.file.fsName!==file.fsName) && !a.overwrite) throw Error("Destination exists; explicit overwrite required."); app.project.save(file); return {path:app.project.file.fsName,verified:app.project.file.fsName===file.fsName}; }
  if(op==="import_footage") { var input=new File(a.path); if(!input.exists) throw Error("Media does not exist."); var options=new ImportOptions(input); options.sequence=!!a.sequence; item=app.project.importFile(options); if(a.frame_rate) item.mainSource.conformFrameRate=a.frame_rate; return {item:__zuraItemInfo(item),verified:!!item}; }
  if(op==="create_folder") { item=app.project.items.addFolder(a.name); return {item:__zuraItemInfo(item),verified:item.name===a.name}; }
  if(op==="create_composition") { c=app.project.items.addComp(a.name,a.width,a.height,a.pixel_aspect||1,a.duration,a.frame_rate); return {item:__zuraItemInfo(c),verified:c.width===a.width && c.height===a.height && Math.abs(c.frameRate-a.frame_rate)<0.001}; }
  if(op==="get_render_queue") { var queue=[]; for(i=1;i<=app.project.renderQueue.numItems;i++){ item=app.project.renderQueue.item(i); queue.push({index:i,comp_id:item.comp.id,status:String(item.status),render:item.render,output:item.outputModule(1).file?item.outputModule(1).file.fsName:null}); } return queue; }
  if(op==="get_render_templates") { c=__zuraComp(a.comp_id);var queueCount=app.project.renderQueue.numItems;item=app.project.renderQueue.items.add(c);try {data={render_settings:item.templates,output_modules:item.outputModule(1).templates};}finally{item.remove();}data.verified=app.project.renderQueue.numItems===queueCount;return data; }
  if(op==="render_queue_item" || op==="remove_render_queue_item") { item=app.project.renderQueue.item(a.queue_index); if(!item) throw Error("Queue item not found.");if(a.expected_comp_id&&item.comp.id!==a.expected_comp_id)throw Error("Queue composition guard failed.");if(a.expected_output_path&&(!item.outputModule(1).file||item.outputModule(1).file.fsName!==new File(a.expected_output_path).fsName))throw Error("Queue output guard failed.");if(op==="remove_render_queue_item"){var before=app.project.renderQueue.numItems;item.remove();return {verified:app.project.renderQueue.numItems===before-1};}if(item.status!==RQItemStatus.QUEUED)throw Error("Queue item is not ready to render.");var others=[];try {for(i=1;i<=app.project.renderQueue.numItems;i++) { var q=app.project.renderQueue.item(i);if(q.status===RQItemStatus.QUEUED||q.status===RQItemStatus.UNQUEUED){others.push({item:q,render:q.render});q.render=(i===a.queue_index);} }app.project.renderQueue.render();return {status:String(item.status),verified:item.status===RQItemStatus.DONE};}finally {for(i=0;i<others.length;i++)try{others[i].item.render=others[i].render;}catch(ignore){}} }
  c=__zuraComp(a.comp_id);
  if(op==="precompose") { var indices=[];for(i=0;i<a.layer_ids.length;i++)indices.push(__zuraLayer(c,a.layer_ids[i]).index);var nested=c.layers.precompose(indices,a.name,a.move_attributes);return {item:__zuraItemInfo(nested),verified:nested.name===a.name}; }
  if(op==="get_composition") { data=__zuraItemInfo(c); data.layers=[]; for(i=1;i<=c.numLayers;i++) data.layers.push(__zuraLayerInfo(c.layer(i))); return data; }
  if(op==="set_composition") { var fields=["width","height","duration","frameRate","bgColor","workAreaStart","workAreaDuration"]; verified=true; for(i=0;i<fields.length;i++) if(a.settings.hasOwnProperty(fields[i])) { c[fields[i]]=a.settings[fields[i]]; if(__zuraJson(c[fields[i]])!==__zuraJson(a.settings[fields[i]])) verified=false; } return {item:__zuraItemInfo(c),verified:verified}; }
  if(op==="open_composition") { c.openInViewer(); return {comp_id:c.id,verified:app.project.activeItem===c}; }
  if(op==="export_frame") {
    var frameFile=new File(a.path);if(frameFile.exists&&!a.overwrite)throw Error("Frame destination exists.");
    if(a.method==="render_queue" || (a.method!=="native"&&app.project.bitsPerChannel===32)){
      if(!a.render_path)throw Error("Render preview needs a server-generated temporary path.");
      var previewItem=app.project.renderQueue.items.add(c);var previewIndex=app.project.renderQueue.numItems;var previewPrefix;
      try {
        var previewModule=previewItem.outputModule(1);var hasPng=false;
        for(i=0;i<previewModule.templates.length;i++)if(previewModule.templates[i]==="PNG")hasPng=true;
        if(!hasPng)throw Error("PNG output template is unavailable; inspect render templates before preview rendering.");
        previewModule.applyTemplate("PNG");previewModule.file=new File(a.render_path);previewPrefix=previewModule.file.fsName;
        previewItem.timeSpanStart=Math.floor(a.time*c.frameRate)/c.frameRate;previewItem.timeSpanDuration=c.frameDuration;
        var rendered=__zuraDispatch("render_queue_item",{queue_index:previewIndex,expected_comp_id:c.id,expected_output_path:previewPrefix});
        if(!rendered.verified)throw Error("Single-frame PNG render did not complete.");
      } finally {previewItem.remove();}
      return {path:frameFile.fsName,rendered_prefix:previewPrefix,width:c.width,height:c.height,method:"render_queue",verified:false};
    }
    c.saveFrameToPng(a.time,frameFile);return {path:frameFile.fsName,width:c.width,height:c.height,method:"native",project_bits_per_channel:app.project.bitsPerChannel,colour_warning:app.project.bitsPerChannel===32?"Explicit native preview may differ from final render colour.":null,verified:false};
  }
  if(op==="export_mogrt") { var folder=new Folder(a.path); if(!folder.exists) throw Error("Destination folder does not exist."); var ok=c.exportAsMotionGraphicsTemplate(!!a.overwrite,folder.fsName); return {exported:ok,verified:false}; }
  if(op==="queue_render") { item=app.project.renderQueue.items.add(c);var queueIndex=app.project.renderQueue.numItems;try { if(a.render_template)item.applyTemplate(a.render_template);if(a.time_start!==undefined)item.timeSpanStart=a.time_start;if(a.time_duration!==undefined)item.timeSpanDuration=a.time_duration; var om=item.outputModule(1); if(a.output_template)om.applyTemplate(a.output_template); var output=new File(a.path); if(output.exists&&!a.overwrite)throw Error("Render output exists."); om.file=output; return {queue_index:queueIndex,comp_id:c.id,path:om.file.fsName,verified:app.project.renderQueue.item(queueIndex).comp.id===c.id&&om.file.fsName===output.fsName}; } catch(e){item.remove();throw e;} }
  if(op==="create_text") { l=c.layers.addText(a.text); if(a.name)l.name=a.name; var doc=l.property("ADBE Text Properties").property("ADBE Text Document").value; if(a.font)doc.font=a.font; if(a.font_size)doc.fontSize=a.font_size; if(a.colour)doc.fillColor=a.colour; l.property("ADBE Text Properties").property("ADBE Text Document").setValue(doc); return {layer:__zuraLayerInfo(l),text:doc.text,verified:l.property("ADBE Text Properties").property("ADBE Text Document").value.text===a.text}; }
  if(op==="create_null") { l=c.layers.addNull(); l.name=a.name; return {layer:__zuraLayerInfo(l),verified:l.name===a.name}; }
  if(op==="create_solid") { l=c.layers.addSolid(a.colour,a.name,a.width||c.width,a.height||c.height,1); return {layer:__zuraLayerInfo(l),verified:l.name===a.name}; }
  if(op==="create_camera") { l=c.layers.addCamera(a.name,a.position); return {layer:__zuraLayerInfo(l),verified:l.name===a.name}; }
  if(op==="create_light") { l=c.layers.addLight(a.name,a.position); return {layer:__zuraLayerInfo(l),verified:l.name===a.name}; }
  if(op==="create_shape") { l=c.layers.addShape(); l.name=a.name; var contents=l.property("ADBE Root Vectors Group"); var group=contents.addProperty("ADBE Vector Group").property("ADBE Vectors Group"); var shape=group.addProperty(a.shape==="ellipse"?"ADBE Vector Shape - Ellipse":"ADBE Vector Shape - Rect"); shape.property(a.shape==="ellipse"?"ADBE Vector Ellipse Size":"ADBE Vector Rect Size").setValue(a.size); var fill=group.addProperty("ADBE Vector Graphic - Fill"); fill.property("ADBE Vector Fill Color").setValue(a.colour); return {layer:__zuraLayerInfo(l),verified:l.name===a.name}; }
  if(op==="add_footage_layer") { l=c.layers.add(__zuraItem(a.item_id)); return {layer:__zuraLayerInfo(l),verified:l.source.id===a.item_id}; }
  l=__zuraLayer(c,a.layer_id);
  if(op==="move_layer") { var relative=__zuraLayer(c,a.relative_layer_id);if(relative===l)throw Error("A layer cannot be moved relative to itself.");if(a.placement==="before")l.moveBefore(relative);else l.moveAfter(relative);return {layer:__zuraLayerInfo(l),verified:a.placement==="before"?l.index===relative.index-1:l.index===relative.index+1}; }
  if(op==="set_blend_mode") { l.blendingMode=BlendingMode[a.mode];return {mode:String(l.blendingMode),verified:l.blendingMode===BlendingMode[a.mode]}; }
  if(op==="set_marker") { var marker=new MarkerValue(a.comment);marker.duration=a.duration;l.marker.setValueAtTime(a.time,marker);var readMarker=l.marker.valueAtTime(a.time,true);return {comment:readMarker.comment,duration:readMarker.duration,verified:readMarker.comment===a.comment&&readMarker.duration===a.duration}; }
  if(op==="get_layer") return __zuraLayerInfo(l);
  if(op==="duplicate_layer") { var duplicate=l.duplicate(); if(a.name)duplicate.name=a.name; return {layer:__zuraLayerInfo(duplicate),verified:duplicate.id!==l.id}; }
  if(op==="remove_layer") { l.remove(); verified=true; for(i=1;i<=c.numLayers;i++)if(c.layer(i).id===a.layer_id)verified=false; return {removed_id:a.layer_id,verified:verified}; }
  if(op==="set_layer") { var allowed=["name","enabled","locked","threeDLayer","shy","solo","inPoint","outPoint","startTime","stretch","adjustmentLayer","guideLayer","motionBlur"]; verified=true; for(i=0;i<allowed.length;i++)if(a.settings.hasOwnProperty(allowed[i])){l[allowed[i]]=a.settings[allowed[i]];if(l[allowed[i]]!==a.settings[allowed[i]])verified=false;} return {layer:__zuraLayerInfo(l),verified:verified}; }
  if(op==="set_parent") { l.parent=a.parent_id ? __zuraLayer(c,a.parent_id) : null; return {layer:__zuraLayerInfo(l),verified:(l.parent?l.parent.id:null)===(a.parent_id||null)}; }
  if(op==="replace_source") { var source=__zuraItem(a.item_id); l.replaceSource(source,!!a.fix_expressions); return {layer:__zuraLayerInfo(l),verified:l.source.id===source.id}; }
  if(op==="set_track_matte") { if(typeof l.setTrackMatte!=="function")throw Error("setTrackMatte is unavailable in this AE version."); var matte=__zuraLayer(c,a.matte_id); var matteType={alpha:TrackMatteType.ALPHA,alpha_inverted:TrackMatteType.ALPHA_INVERTED,luma:TrackMatteType.LUMA,luma_inverted:TrackMatteType.LUMA_INVERTED}[a.matte_type]; l.setTrackMatte(matte,matteType); return {verified:l.trackMatteLayer===matte&&l.trackMatteType===matteType}; }
  if(op==="add_effect") { var fx=l.property("ADBE Effect Parade"); if(!fx.canAddProperty(a.match_name))throw Error("Effect is unavailable: "+a.match_name); p=fx.addProperty(a.match_name); return {effect:__zuraPropInfo(p),index:p.propertyIndex,verified:p.matchName===a.match_name}; }
  if(op==="add_mask") { p=l.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var mask=new Shape(); mask.vertices=a.vertices; mask.closed=a.closed!==false; p.property("ADBE Mask Shape").setValue(mask); return {index:p.propertyIndex,verified:__zuraJson(p.property("ADBE Mask Shape").value.vertices)===__zuraJson(a.vertices)}; }
  p=__zuraProperty(l,a.property_path||[]);
  if(op==="add_property") { if(!p.canAddProperty(a.match_name))throw Error("This group cannot add that property.");var added=p.addProperty(a.match_name);return {property:__zuraPropInfo(added),index:added.propertyIndex,verified:added.matchName===a.match_name}; }
  if(op==="set_text_style") { var styled=p.value;if(!(styled instanceof TextDocument))throw Error("Property is not text.");for(var styleKey in a.settings)if(a.settings.hasOwnProperty(styleKey))styled[styleKey]=a.settings[styleKey];p.setValue(styled);var styledRead=p.value;var styles={};verified=true;for(styleKey in a.settings)if(a.settings.hasOwnProperty(styleKey)){styles[styleKey]=styledRead[styleKey];if(__zuraJson(styledRead[styleKey])!==__zuraJson(a.settings[styleKey]))verified=false;}return {styles:styles,verified:verified}; }
  if(op==="list_properties") { var props=[]; for(i=1;i<=p.numProperties;i++)props.push(__zuraPropInfo(p.property(i))); return props; }
  if(op==="get_property") return __zuraPropInfo(p);
  if(op==="get_keyframes") { var keys=[]; for(i=1;i<=p.numKeys;i++)keys.push({index:i,time:p.keyTime(i),value:p.keyValue(i),in_interpolation:String(p.keyInInterpolationType(i)),out_interpolation:String(p.keyOutInterpolationType(i))}); return keys; }
  if(op==="set_property") { p.setValue(a.value); return {property:__zuraPropInfo(p),verified:__zuraJson(p.value)===__zuraJson(a.value)}; }
  if(op==="set_text") { var textDoc=p.value; if(!(textDoc instanceof TextDocument))throw Error("Property is not text."); textDoc.text=a.text; p.setValue(textDoc); return {text:p.value.text,verified:p.value.text===a.text}; }
  if(op==="set_shape_path") { var pathShape=new Shape();pathShape.vertices=a.vertices;pathShape.inTangents=a.in_tangents;pathShape.outTangents=a.out_tangents;pathShape.closed=a.closed; p.setValue(pathShape);return {verified:__zuraJson(p.value.vertices)===__zuraJson(a.vertices)}; }
  if(op==="set_keyframes") { verified=true; for(i=0;i<a.keys.length;i++){var k=a.keys[i];p.setValueAtTime(k.time,k.value);if(__zuraJson(p.valueAtTime(k.time,true))!==__zuraJson(k.value))verified=false;} return {num_keys:p.numKeys,verified:verified}; }
  if(op==="remove_keyframe") { var old=p.numKeys;p.removeKey(a.key_index);return {num_keys:p.numKeys,verified:p.numKeys===old-1}; }
  if(op==="set_keyframe_interpolation") { var types={linear:KeyframeInterpolationType.LINEAR,bezier:KeyframeInterpolationType.BEZIER,hold:KeyframeInterpolationType.HOLD};p.setInterpolationTypeAtKey(a.key_index,types[a.in_type],types[a.out_type]);return {verified:p.keyInInterpolationType(a.key_index)===types[a.in_type]&&p.keyOutInterpolationType(a.key_index)===types[a.out_type]}; }
  if(op==="set_temporal_ease") { var ins=[],outs=[];for(i=0;i<a.in_ease.length;i++)ins.push(new KeyframeEase(a.in_ease[i].speed,a.in_ease[i].influence));for(i=0;i<a.out_ease.length;i++)outs.push(new KeyframeEase(a.out_ease[i].speed,a.out_ease[i].influence));p.setTemporalEaseAtKey(a.key_index,ins,outs);return {verified:__zuraJson(p.keyInTemporalEase(a.key_index))===__zuraJson(ins)&&__zuraJson(p.keyOutTemporalEase(a.key_index))===__zuraJson(outs)}; }
  if(op==="set_expression") { p.expression=a.expression; return {expression:p.expression,error:p.expressionError,verified:p.expression===a.expression&&!p.expressionError}; }
  if(op==="set_spatial_tangents") { p.setSpatialTangentsAtKey(a.key_index,a.in_tangent,a.out_tangent);return {verified:__zuraJson(p.keyInSpatialTangent(a.key_index))===__zuraJson(a.in_tangent)&&__zuraJson(p.keyOutSpatialTangent(a.key_index))===__zuraJson(a.out_tangent)}; }
  if(op==="remove_property") { var parent=p.parentProperty;var count=parent.numProperties;p.remove();return {verified:parent.numProperties===count-1}; }
  if(op==="expose_mogrt_property") { var exposed=p.addToMotionGraphicsTemplateAs(c,a.name);return {exposed:exposed,verified:false}; }
  throw Error("Unknown operation: "+op);
}
function __zuraRun(op,a,mutating) {
  var grouped=false,started=false;
  try {
    if(!app.project)throw Error("No project is open.");
    if(a.expected_project_path && (!app.project.file || new File(a.expected_project_path).fsName!==app.project.file.fsName))throw Error("The open project does not match expected_project_path.");
    if(mutating){app.beginUndoGroup("Zura: "+op);grouped=true;started=true;}
    var data;
    if(op==="batch_edit") {
      var steps=[];var allVerified=true;
      for(var j=0;j<a.steps.length;j++) {
        try {var stepData=__zuraDispatch(a.steps[j].operation,a.steps[j].args);steps.push({operation:a.steps[j].operation,status:stepData.verified?"verified":"committed_unverified",data:stepData});if(!stepData.verified)allVerified=false;}
        catch(stepError){steps.push({operation:a.steps[j].operation,status:"possibly_modified",error:String(stepError)});return __zuraJson({success:false,status:"possibly_modified",steps:steps,failed_step:j,retry_safe:false});}
      }
      data={steps:steps,verified:allVerified};
    } else data=__zuraDispatch(op,a);
    return __zuraJson({success:true,status:mutating?(data.verified?"verified":"committed_unverified"):"inspected",data:data});
  } catch(e) { return __zuraJson({success:false,status:started?"possibly_modified":"failed",error:String(e),retry_safe:!started}); }
  finally {if(grouped)app.endUndoGroup();}
}

