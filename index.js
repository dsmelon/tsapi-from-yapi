#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const process = require('process');
const curdirname = process.cwd();
let cookie = '', localCookie = '', response = [], responseo = [], temp = {}, logs = [], preTarget = [], curTarget = [], urlCom = '', filesMap = {}, interfacesMap = {};
try {
  localCookie = require(path.join(curdirname, 'tfyTemp/cookie.json')).cookie;
} catch (error) {}
let mapType = {
  integer: 'number',
  file: 'File',
  text: 'Text'
}

function wt(s, obj = {}){
  let type = '';
  if(s.constructor === Array) type = s.map(v => mapType[v] || v).join(' | ');
  else type = mapType[s] || s;
  if(obj.enum){
    switch(s){
      case 'string': return `'${obj.enum.join(`' | '`)}'`
      default: return obj.enum.join(` | `);
    }
  }
  return type
}

function request (url, cookie) {
  return fetch(url, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,tt;q=0.8",
      "cookie": cookie
    },
    "referrer": url,
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": null,
    "method": "GET",
    "mode": "cors"
  }).then(res=>res.json())
}

const place = {
  $req_headers: '($$req_headers$$)',
  $req_headers_mark: '($$req_headers_mark$$)',
  $req_headers_markfr: '($$req_headers_markfr$$)',
  $req_params: '($$req_params$$)',
  $req_params_mark: '($$req_params_mark$$)',
  $req_params_markfr: '($$req_params_markfr$$)',
  $req_query: '($$req_query$$)',
  $req_query_mark: '($$req_query_mark$$)',
  $req_query_markfr: '($$req_query_markfr$$)',
  $req_body: '($$req_body$$)',
  $req_body_mark: '($$req_body_mark$$)',
  $req_body_markfr: '($$req_body_markfr$$)',
  $res_body: '($$res_body$$)',
  $res_body_mark: '($$res_body_mark$$)',
  $res_body_markfr: '($$res_body_markfr$$)',
  $name: '($$name$$)'
}

function getScame(_list, _cookie, _cb){
  let cur = 0, end = 0, err = 0;
  function move(list, cookie, cb, r, rej){
    end++;
    let k = 0;
    list.forEach(v => {
      request(v, cookie).then(res => {
        k++;
        if(+res.errcode !== 0){
          err++;
          console.log(`${v} \x1B[31m${res.errmsg}\x1B[0m`)
        }else{
          switch(true){
            case /\/api\/interface\/list\?/.test(v):
              if(res.data.list.length > 0){
                const u = `${v.split("?")[0].replace('list', 'get')}?id=`
                const l = res.data.list.map(vv => `${u}${vv._id}`)
                move(l, cookie, cb, r)
              }
            break;
            case /\/api\/interface\/list_cat\?/.test(v):
              if(res.data.list.length > 0){
                const u = `${v.split("?")[0].replace('list_cat', 'get')}?id=`
                const l = res.data.list.map(vv => `${u}${vv._id}`)
                move(l, cookie, cb, r)
              }
            break;
            case /\/api\/project\/list\?/.test(v):
              if(res.data.list.length > 0){
                const u = `${v.split("?")[0].replace('project', 'interface')}?page=1&limit=10000&project_id=`
                const l = res.data.list.map(vv => `${u}${vv._id}`)
                move(l, cookie, cb, r)
              }
            break;
            case /\/api\/group\/list/.test(v):
              if(res.data.length > 0){
                const u = `${v.split("?")[0].replace('group', 'project')}?page=1&limit=10000&group_id=`
                const l = res.data.map(vv => `${u}${vv._id}`)
                move(l, cookie, cb, r)
              }
            break;
            case /\/api\/interface\/get/.test(v):
              !urlCom && (urlCom = v);
              cb(res.data)
            break;
          }
        }
        if(k === list.length) cur++;
        if(cur === end) err ? rej() : r();
      }).catch(() => {
        err++;
        console.log(`${v} \x1B[31m网络错误\x1B[0m`)
      })
    })
  }
  return new Promise((resolve, reject) => {
    move(_list, _cookie, _cb, resolve, reject)
  })
}

(async function(){
  try {
    fs.accessSync(path.join(curdirname, 'tfy.config.js'), fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    console.log('\x1B[31m未发现配置文件 tfy.config.js(no found tfy.config.js file)\x1B[0m');
    return;
  }
  let { urls, cookie:__cookie = '', loginParams = {}, isLdap, template, excludes, typeMerge, mode = 'update', importTile = '', importQuotation = `'` } = require(path.join(curdirname, 'tfy.config.js'));
  if(typeMerge) mapType = { ...mapType, ...typeMerge };
  if(check({ urls })) return;
  cookie = localCookie;
  let test;
  try {
    if(cookie){
      test = await request(urls[0], cookie);
      if(+test.errcode !== 0){
        cookie = __cookie;
        if(cookie){
          test = await request(urls[0], cookie);
          if(+test.errcode !== 0){
            await login(urls[0], loginParams, isLdap)
          }
        }else{
          await login(urls[0], loginParams, isLdap)
        }
      }
    }else{
      cookie = __cookie;
      if(cookie){
        test = await request(urls[0], cookie);
        if(+test.errcode !== 0){
          await login(urls[0], loginParams, isLdap)
        }
      }else{
        await login(urls[0], loginParams, isLdap)
      }
    }
  } catch (error) {}

  try {
    await getScame(urls, cookie, data => {
      if(excludes && excludes.some(v => v.test(data.path))) return;
      if(temp[data._id]) return
      temp[data._id] = true
      response.push({
        req_id: data._id,
        p_id: data.project_id,
        method: data.method,
        req_url: data.path,
        req_desc: (data.title || '').trim(),
        req_username: data.username,
        req_headers: toRule(data.req_headers, 'key-value'),
        req_params: toRule(data.req_params, 'key-value'),
        req_query: toRule(data.req_query, 'key-value'),
        req_body: toRule(data.req_body_type === 'form' ? data.req_body_form : data.req_body_other, data.req_body_type),
        res_body: toRule(data.res_body_type === 'form' ? data.res_body_form : data.res_body, data.res_body_type),
        ...place
      })
    })
  } catch (error) {
    return;
  }

  const pids = [];
  let errs = 0;
  response.forEach(v =>{
    !pids.includes(v.p_id) && pids.push(v.p_id);
  })
  const basePath = {};
  if(pids.length) try {
    await new Promise((r, rej) => {
      let k = 0;
      const url = urlCom.replace(/interface.*$/, `project/get?id=`)
      pids.forEach(w => {
        request(`${url}${w}`, cookie).then(res => {
          k++;
          if(+res.errcode !== 0){
            errs++;
            console.log(`${url}${w} \x1B[31m${res.errmsg}\x1B[0m`);
          }else{
            basePath[w] = res.data.basepath;
          }
          if(k === pids.length) errs ? rej() : r();
        }).catch(() => {
          errs++;
          console.log(`${url}${w} \x1B[31m网络错误\x1B[0m`)
        })
      })
    })
  } catch (error) {
    return;
  } 
  

  try {
    preTarget = require(path.join(curdirname, 'tfyTemp/target.json'));
    if(mode !== 'reset') {
      curTarget = JSON.parse(JSON.stringify(preTarget));
    }
  } catch (error) {}

  switch(typeof(template)){
    case 'function':
      response.forEach(v => {
        v.req_url = `${basePath[v.p_id] || ''}${v.req_url}`;
        v.__template = template(v) || {};
        v.__template.top = v.__template.top || '';
        v.__template.bottom = v.__template.bottom || '';
        v.__template.repeat = v.__template.repeat || '';
        v.__template.name = v.__template.name || 'name';
      })
    break;
  }

  const names = {}, namesRev = {};
  response.forEach(v => {
    namesRev[v.req_id] = v.__template.name;
  })
  switch(mode){
    case 'update':
      curTarget.forEach(v => {
        !namesRev[v.id] && (namesRev[v.id] = v.name);
      })
    break;
    case 'add':
      curTarget.forEach(v => {
        namesRev[v.id] = v.name;
      })
    break;
  }
  Object.keys(namesRev).forEach(v => {
    !names[namesRev[v]] && (names[namesRev[v]] = []);
    names[namesRev[v]].push(v)
  })
  response.forEach(v => {
    v.rename = (names[v.__template.name] || []).length > 1
  })

  response.forEach(v =>{
    let filePath = v.__template.filePath;
    if(!filePath) return;
    let interfacePath = v.__template.interfacePath || v.__template.filePath.replace(/\.ts$/, '') + '-i';
    if(!/\.ts$/.test(filePath)) filePath += '.ts';
    if(!/\.ts$/.test(interfacePath)) interfacePath += '.d.ts';
    const name = toName(v.__template.name, v.req_id, v.rename);
    const req_headers = {
      content: v.__template.req_headers || v.req_headers,
      need: (v.__template.repeat || '').includes(place.$req_headers),
      name: toNodeName(`${name}$reqheaders`, v.__template.req_headers || v.req_headers)
    };
    const req_params = {
      content: v.__template.req_params || v.req_params,
      need: (v.__template.repeat || '').includes(place.$req_params),
      name: toNodeName(`${name}$reqparams`, v.__template.req_params || v.req_params)
    };
    const req_query = {
      content: v.__template.req_query || v.req_query,
      need: (v.__template.repeat || '').includes(place.$req_query),
      name: toNodeName(`${name}$reqquery`, v.__template.req_query || v.req_query)
    };
    const req_body = {
      content: v.__template.req_body || v.req_body,
      need: (v.__template.repeat || '').includes(place.$req_body),
      name: toNodeName(`${name}$reqbody`, v.__template.req_body || v.req_body)
    };
    const res_body = {
      content: v.__template.res_body || v.res_body,
      need: (v.__template.repeat || '').includes(place.$res_body),
      name: toNodeName(`${name}$resbody`, v.__template.res_body || v.res_body)
    };
    const indent = v.__template.indent || '';
    const isFieldDesc = v.__template.isFieldDesc;
    const frIndent = v.__template.frIndent || '';
    let code = v.__template.repeat;
    code = code.replace(place.$name, name);
    if(req_headers.need){
      code = code.replace(place.$req_headers_mark, req_headers.content.required ? ':' : '?:')
                 .replace(place.$req_headers_markfr, req_headers.content.required || req_headers.name === wt('null') ? '' : `${frIndent}|${frIndent}${wt('null')}`)
                 .replace(place.$req_headers, `${req_headers.name}`);
    }
    if(req_params.need){
      code = code.replace(place.$req_params_mark, req_params.content.required ? ':' : '?:')
                 .replace(place.$req_params_markfr, req_params.content.required || req_params.name === wt('null') ? '' : `${frIndent}|${frIndent}${wt('null')}`)
                 .replace(place.$req_params, `${req_params.name}`);
    }
    if(req_body.need){
      code = code.replace(place.$req_body_mark, req_body.content.required ? ':' : '?:')
                 .replace(place.$req_body_markfr, req_body.content.required || req_body.name === wt('null') ? '' : `${frIndent}|${frIndent}${wt('null')}`)
                 .replace(place.$req_body, `${req_body.name}`);
    }
    if(req_query.need){
      code = code.replace(place.$req_query_mark, req_query.content.required ? ':' : '?:')
                 .replace(place.$req_query_markfr, req_query.content.required || req_query.name === wt('null') ? '' : `${frIndent}|${frIndent}${wt('null')}`)
                 .replace(place.$req_query, `${req_query.name}`);
    }
    if(res_body.need){
      code = code.replace(place.$res_body_mark, res_body.content.required ? ':' : '?:')
                 .replace(place.$res_body_markfr, res_body.content.required || res_body.name === wt('null') ? '' : `${frIndent}|${frIndent}${wt('null')}`)
                 .replace(place.$res_body, `${res_body.name}`);
    }
    const tsapi = [];
    const impo = [];
    if(req_headers.need && /.+\$reqheaders>*$/.test(req_headers.name)){
      v.__template.mode === 'import' && impo.push(`${name}$reqheaders`);
      tsapi.push(toTsApi(`${name}$reqheaders`, req_headers, indent, isFieldDesc, v.__template.mode));
    }
    if(req_params.need && /.+\$reqparams>*$/.test(req_params.name)){
      v.__template.mode === 'import' && impo.push(`${name}$reqparams`);
      tsapi.push(toTsApi(`${name}$reqparams`, req_params, indent, isFieldDesc, v.__template.mode));
    }
    if(req_query.need && /.+\$reqquery>*$/.test(req_query.name)){
      v.__template.mode === 'import' && impo.push(`${name}$reqquery`);
      tsapi.push(toTsApi(`${name}$reqquery`, req_query, indent, isFieldDesc, v.__template.mode));
    }
    if(req_body.need && /.+\$reqbody>*$/.test(req_body.name)){
      v.__template.mode === 'import' && impo.push(`${name}$reqbody`);
      tsapi.push(toTsApi(`${name}$reqbody`, req_body, indent, isFieldDesc, v.__template.mode));
    }
    if(res_body.need && /.+\$resbody>*$/.test(res_body.name)){
      v.__template.mode === 'import' && impo.push(`${name}$resbody`);
      tsapi.push(toTsApi(`${name}$resbody`, res_body, indent, isFieldDesc, v.__template.mode));
    }
    responseo.push({
      id: v.req_id,
      name: v.__template.name,
      url: v.req_url,
      filePath,
      interfacePath,
      impo,
      top: v.__template.top,
      bottom: v.__template.bottom,
      code,
      tsapi
    })
  })

  responseo.forEach(v => {
    const index = curTarget.findIndex(w => w.id === v.id);
    switch(mode){
      case 'reset':
      case 'update':
        if(index >= 0) curTarget[index] = v;
        else curTarget.push(v);
      break;
      case 'add':
        if(index < 0) curTarget.push(v);
      break;
    }
  })

  curTarget.forEach(({ filePath, interfacePath, top, bottom, impo, tsapi, code }) => {
    if(!filesMap[filePath]) filesMap[filePath] = {};
    if(!filesMap[filePath].top) filesMap[filePath].top = [];
    if(!filesMap[filePath].bottom) filesMap[filePath].bottom = [];
    if(!filesMap[filePath].top.includes(top)) filesMap[filePath].top.push(top);
    if(!filesMap[filePath].bottom.includes(bottom)) filesMap[filePath].bottom.push(bottom);
    if(!filesMap[filePath].repeat) filesMap[filePath].repeat = [];
    if(!filesMap[filePath].impo) filesMap[filePath].impo = {};
    if(!filesMap[filePath].impo[interfacePath]) filesMap[filePath].impo[interfacePath] = [];
    if(!interfacesMap[interfacePath]) interfacesMap[interfacePath] = [];
    filesMap[filePath].impo[interfacePath] = filesMap[filePath].impo[interfacePath].concat(impo);
    if(tsapi.length) interfacesMap[interfacePath] = interfacesMap[interfacePath].concat(tsapi);
    filesMap[filePath].repeat.push(code);
  })

  const deletes = [];
  preTarget.forEach(v => {
    !deletes.includes(v.filePath) && deletes.push(v.filePath);
    !deletes.includes(v.interfacePath) && deletes.push(v.interfacePath);
  })

  deletes.forEach(v => deleteFile(v))

  Object.keys(filesMap).forEach(v => {
    const it = filesMap[v];
    let content = Object.keys(it.impo).map(w => {
      const item = it.impo[w];
      return item.length ? `import { ${item.join(', ')} } from ${importQuotation}${pathformat(path.relative(v, w))}${importQuotation}${importTile}\n` : ''
    }).join('');
    const _top = it.top.join('\n');
    const _repeat = it.repeat.join('\n');
    const _bottom = it.bottom.join('\n');
    content += _top ? `${_top}\n` : '';
    content += _repeat ? `${_repeat}\n` : '';
    content += _bottom ? `${_bottom}\n` : '';
    content && writeFile(content, v);
  })
  Object.keys(interfacesMap).forEach(v => {
    const it = interfacesMap[v];
    let content = it.join('');
    content && writeFile(content, v);
  })
  writeFile(JSON.stringify(curTarget, null, '  '), 'tfyTemp/target.json');
  writeFile(JSON.stringify({ cookie }, null, '  '), 'tfyTemp/cookie.json');

  curTarget.forEach(v => {
    const preItem = preTarget.find(w => w.id === v.id);
    if(preItem){
      let logTemp = [];
      let isUpdate = false;
      if(preItem.filePath !== v.filePath) {
        isUpdate = true;
        logTemp.push({
          name: `  文件路径(file path)`,
          act: '',
          color: '\x1B[35m'
        })
      }
      if(preItem.interfacePath !== v.interfacePath) {
        isUpdate = true;
        logTemp.push({
          name: `  接口文件路径(interface file path)`,
          act: '',
          color: '\x1B[35m'
        })
      }
      if(preItem.top !== v.top) {
        isUpdate = true;
        logTemp.push({
          name: `  顶部文案(top text)`,
          act: '',
          color: '\x1B[35m'
        })
      }
      if(preItem.code !== v.code) {
        isUpdate = true;
        logTemp.push({
          name: `  主体(main)`,
          act: '',
          color: '\x1B[35m'
        })
      }
      if(preItem.bottom !== v.bottom) {
        isUpdate = true;
        logTemp.push({
          name: `  底部文案(bottom text)`,
          act: '',
          color: '\x1B[35m'
        })
      }
      if(preItem.tsapi.join('') !== v.tsapi.join('')) {
        isUpdate = true;
        logTemp.push({
          name: `  接口(interface)`,
          act: '',
          color: '\x1B[35m'
        })
      }
      isUpdate && logs.push({
        name: v.url,
        act: '更新(update)',
        color: '\x1B[33m'
      })
      logs = logs.concat(logTemp);
    }else{
      logs.push({
        name: v.url,
        act: '新增(add)',
        color: '\x1B[32m'
      })
    }
  })

  preTarget.forEach(v => {
    const curItem = curTarget.find(w => w.id === v.id);
    if(!curItem) {
      logs.push({
        name: v.url,
        act: '删除(delete)',
        color: '\x1B[31m'
      })
    }
  })

  if(logs.length){
    let logString = '';
    const count = Math.max(...logs.map(w => w.name.length));
    logs.forEach(w => {
      logString += `${w.color}${w.name.padEnd(count + 2)}${w.act}\n\x1B[0m`;
    })
    console.log(logString);
  }else{
    console.log('未发现差异(no different)')
  }

})()

function check({urls}){
  if(!urls || !urls.length){
    console.log('\x1B[31murls字段不能为空(urls field is empty)\x1B[0m');
    return;
  }
}

function toType(value){
  try {
    const val = JSON.parse(value);
    if(typeof(val) === 'number') return 'number';
    if(typeof(val) === 'boolean') return 'boolean';
    return 'string'
  } catch (error) {
    return 'string'
  }
}

function toRule(body = [], type){
  switch(type){
    case 'form': 
      if(!body.length) return {
        type: 'null',
        required: false
      }
      return {
        type: 'object',
        required: body.some(w => !!+w.required),
        __object: body.map(w => ({
          name: w.name,
          required: !!+w.required,
          type: w.type,
          desc: w.desc
        }))
      }
    case 'key-value': 
      if(!body.length) return {
        type: 'null',
        required: false
      }
      return {
        type: 'object',
        required: body.some(w => !!+w.required),
        __object: body.map(w => ({
          name: w.name,
          required: !!+w.required,
          type: toType(w.value || w.example),
          desc: w.desc
        }))
      }
    case 'json':
      let obj = {};
      try {
        obj = JSON.parse(body || '{}')
      } catch (error) {}
      if(!body || body === '{}') return {
        type: 'null',
        required: false
      }
      return toField(obj);
    default: return {
      type: 'null',
      required: false
    }
  }
}

function toField({name, enum:_enum, properties, items = {}, isneed = [], required = [], type, description, title}, obj = {}){
  obj.name = name;
  obj.type = type;
  obj.desc = description || title;
  obj.required = isneed.includes(name);
  obj.enum = _enum;
  switch(type){
    case 'object':
      obj.__object = []
      for(let key in properties){
        const item = properties[key];
        obj.__object.push(toField({name: key, isneed: required, ...item}));
      }
    break;
    case 'array':
      obj.__array = toField(items);
    break;
  }
  return obj;
}

function toTsApi(name, { content: scame }, indent = '  ', isFieldDesc, _mode){
  let count = 0, temp = '';
  function start(_scame, isarr){
    _scame.desc = (_scame.desc || '').trim();
    switch(_scame.type){
      case 'object':
        if(isarr){
          temp += `{${isFieldDesc && _scame.desc ? ` // ${_scame.desc}` : ''}\n`;
          count++;
          _scame.__object.forEach(w => {
            start(w)
          })
          count--;
          temp += `${Array.from({length: count}, () => indent).join('')}}`;
        } else {
          if(count === 0) temp += `{\n`
          else temp += `${Array.from({length: count}, () => indent).join('')}${_scame.name}${_scame.required ? '' : '?'}: {${isFieldDesc && _scame.desc ? ` // ${_scame.desc}` : ''}\n`;
          count++;
          _scame.__object.forEach(w => {
            start(w)
          })
          count--;
          temp += `${Array.from({length: count}, () => indent).join('')}}${count ? ';' : ''}\n`;
        }
      break;
      case 'array':
        if(count === 0){
          start(_scame.__array, true);
          temp += '\n';
        } else {
          if(_scame.name) temp += `${Array.from({length: count}, () => indent).join('')}${_scame.name}${_scame.required ? '' : '?'}: Array<`;
          else temp += `Array<`;
          start(_scame.__array, true);
          if(_scame.name) temp += `>;${isFieldDesc && _scame.desc ? ` // ${_scame.desc}` : ''}\n`;
          else temp += '>';
        }
      break;
      default:
        if(isarr) temp += `${wt(_scame.type, _scame)}`;
        else temp += `${Array.from({length: count}, () => indent).join('')}${_scame.name}${_scame.required ? '' : '?'}: ${wt(_scame.type, _scame)};${isFieldDesc && _scame.desc ? ` // ${_scame.desc}` : ''}\n`;
      break;
    }
    
  }
  start(scame)
  return `${_mode === 'import' ? 'export ' : ''}interface ${name} ${temp}`
}

function toName(name, id, rename){
  if(rename) return `${name}${id}`;
  else return name;
}

function toNodeName(name, obj){
  if(obj.type !== 'object'){
    if(obj.type === 'array'){
      return `Array<${toNodeName(name, obj.__array)}>`
    }
    return wt(obj.type, obj)
  }
  return name;
}

function writeFile(content, ...args){
  const paths = args.map(w => w.split('/')).flat().filter(w => !!w && w !== '.').map(w => /^\.+$/.test(w) ? `${w}/` : w);
  let curPath = curdirname;
  const len = paths.length;
  paths.forEach((w, k) => {
    curPath = path.join(curPath, w)
    if(k === len - 1) {
      fs.writeFileSync(curPath, content, 'utf-8');
    } else {
      try {
        fs.statSync(curPath);
      } catch (error) {
        fs.mkdirSync(curPath);
      }
    }
  })
}

function deleteFile(...args){
  let curPath = path.join(curdirname, ...args);
  try {
    const stat = fs.statSync(curPath);
    if(stat.isDirectory()){
      fs.rmdirSync(curPath);
    }else{
      fs.unlinkSync(curPath);
    }
    const curFile = fs.readdirSync(path.join(curPath, '../'));
    const isCurDir = path.join(curdirname, '/') === curPath;
    !isCurDir && !curFile.length && deleteFile(...args, '../');
  } catch (error) {}
}

function pathformat(string){
  string = string.replace(/\\/g, '/').replace(/^..\//, './').replace(/^.\/..\//, '../').replace(/\.ts$/, '');
  if(string[0] !== '.') string = `./${string}`;
  return string;
}

function login(url, params = {}, isLdap){
  let baseUrl = url.split("/");
  baseUrl = `${baseUrl[0]}//${baseUrl[2]}`;
  return new Promise((resolve, reject) => {
    fetch(`${baseUrl}/api/user/login${isLdap ? '_by_ldap' : ''}`, {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,tt;q=0.8",
        "content-type": "application/json;charset=UTF-8",
        "proxy-connection": "keep-alive"
      },
      "referrer": baseUrl,
      "referrerPolicy": "no-referrer-when-downgrade",
      "body": JSON.stringify(params),
      "method": "POST",
      "mode": "cors"
    }).then(res => {
      return Promise.all([res.json(), res.headers.raw()['set-cookie']])
    }).then(([res, coo]) => {
      if(+res.errcode !== 0){
        console.log(`登录失败(login fail) \x1B[31m${res.errmsg}\x1B[0m`);
        reject();
      }else{
        const c = [];
        if(coo.constructor === Array){
          coo.forEach(v => {
            c.push(v.split(";")[0])
          })
        }else{
          c.push(coo.split(';')[0])
        }
        cookie = c.join(';')
        cookie ? resolve() : reject();
      }
    }).catch(err => {
      reject();
    })
  })
}