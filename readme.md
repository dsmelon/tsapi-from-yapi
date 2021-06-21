**这是一个将yapi网站接口转换为本地typescript interface的工具**
**可以使用以下方式安装**
```cmd
npm install tsapi-from-yapi -g
```
**或者**
```cmd
npm install tsapi-from-yapi --save-dev
```
**这种方式需要在package包中补充命令，全局安装不用**
```javascript
"scrpit":{
	"tfy": "tfy"
}
```
**在当前工作目录创建配置文件tfy.config.js来生成你的代码，如下所示：**
```javascript
module.exports = {
  urls: [
    'http://yapi.secondpath.com/api/interface/list'
  ],
  typeMerge: {
    text: 'string'
  },
  loginParams: {
    email: 'your email',
    password: 'your pwd'
  },
  cookie: 'cookie',
  isLdap: true,
  mode: 'reset',
  excludes: [/test/],
  importTile: '',
  importQuotation: `'`,
  template: val => {
    return {
      top: `import request from './request'`,
      frIndent: ' ',
      repeat: 'your code',
      bottom: '',
      filePath: './api/index',
      interfacePath: './interface/index',
      name: 'name',
      indent: '  ',
      isFieldDesc: true,
      mode: 'import'
    }
  }
}
```
**执行命令进行生成，对应全局和局部安装**
```cmd
tfy
```
**或者**
```cmd
npm run tfy
```
|参数名|类型|默认值|说明|值|
|:-|:-|:-|:-|:-|
|urls|string[]|无|yapi接口地址|可以f12获取接口地址填入，会递归完成所有请求，支持类似如下四种：<br/>\*/api/interface/list?\*<br/>\*/api/interface/list_cat?\*<br/>\*/api/project/list?\*<br/>\*/api/group/list\*<br/>\*/api/interface/get\*|
|typeMerge|object?|无|类型覆盖，会合并到原有类型上||
|loginParams|object?|无|登录需要的参数||
|isLdap|boolean?|false|是否是LDAP方式登录|true丨false|
|cookie|string?|无|网站的cookie，传cookie时可以不传loginParams，需自己登录获取cookie填入||
|mode|string?|update|生成模式|reset:重置模式，根据配置文件重新生成代码<br/>update：更新模式，不删除，更新追加代码<br/>add:追加模式，不删除，不更新，只追加代码|
|excludes|regexp[]?|无|根据返回的path进行过滤||
|importTile|string?|''|当interface为导入模式时，尾部的符号||
|importQuotation|string?|'|interface为导入模式时，引号的符号||
|template|function(reponse)|无|代码模板，返回对象|reponse => object|

**template 返回字段说明**

> top：非必传，文件顶部文案，汇总文件对应的每个reponse，过滤掉重复

> bottom: 同上，文件底部文案

> repeat: 代码主体模板，可以根据占位符等信息填充

> filePath: 生成文件地址，可不写后缀名

> interfacePath: 非必传，可不写后缀名，ts接口文件地址，不传时会在filePath下生成filePath-i.d.ts文件，注意不要和filePath仅后缀名不同或者相同

> name: 一个名字，如果是函数可用做函数名，不建议使用response内的信息填充，可能会有重复，要在此给定名字，再用占位符填充即可防止重名

> indent: interface缩进符号，可以用双空格或者tab

> frIndent: interface作为函数返回值使用时的间隔符号，可以设置为' '或者''

> isFieldDesc: 字段注释，是否生成字段注释

> mode: interface模式，import为导入模式，不传时为全局模式，为全局模式时若vscode检测不到需要进入interface文件保存一次即被检测到

> req_username,req_headers,req_params,req_query,req_body,res_body 回传的内容，当不回传时使用response原始数据


**repsonse结构说明**

> req_url 请求地址

> req_desc 请求地址描述

> req_username 请求地址开发者

> req_headers 请求头

> req_params 请求参数

> req_query 请求查询参数

> req_body 请求体

> res_body 响应体


以下是占位符，可以在template的repeat里被替换，是变量，不是字符串，使用时要使用reponse.$name等，根据需要使用，未使用的不生成对应interface

> $req_headers: 请求头interface占位符

> $req_headers_mark: 请求头是否必传占位符

> $req_headers_markfr: 请求头作为函数返回值时是否必传占位符

> $req_params: 同上

> $req_params_mark: 同上

> $req_params_markfr: 同上

> $req_query: 同上

> $req_query_mark: 同上

> $req_query_markfr: 同上

> $req_body: 同上

> $req_body_mark: 同上

> $req_body_markfr: 同上

> $res_body: 同上

> $res_body_mark: 同上

> $res_body_markfr: 同上

> $name: 返回的name占位符，当有重名时，会在其后补充唯一id进行唯一区分


例子：

配置
```javascript
{
  template: val => {
    return {
      top: `import request from './request'`,
      frIndent: ' ',
      repeat: `export async function ${val.$name}(data${val.$req_query_mark} ${val.$req_query}): Promise<${val.$res_body}${val.$res_body_markfr}>{
  return await request('${val.req_url}')
}`,
      bottom: '',
      filePath: `./src/${val.req_url.split('/').reverse()[1]}`,
      interfacePath: `a`,
      name: val.req_url.split('/').pop(),
      indent: '  ',
      isFieldDesc: true,
      mode: 'import'
    }
  }
}
```
生成
```javascript
import { req$reqquery, res$resbody } from './../a.d'
import request from './request'
export async function getList(data: req$reqquery): Promise<res$resbody | null>{
  return await request('/getList')
}
...
```
如果只是js代码也可以使用本插件生成