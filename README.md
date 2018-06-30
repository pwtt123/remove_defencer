# revocation-defence

能够帮你保护创建一定时间内的文件，防止被意外删除

再也不怕qq群开车时，老司机们撤回图片太快了

ps： qq 图片文件夹 一般在： 我的文档\\Tencent Files\\QQ号\\Image\\Group


## Getting start


**start**

 初始化参数：

* ifDefendUpdating:0/1, 存在则文件每次更新也会视作被添加
* sourcePath:"" ，防止文件撤回的文件夹， 一般qq图片文件夹在： 我的文档\\Tencent Files\\QQ号\\Image\\Group
* outputPath:"", 撤回图片保存的目录
* timeout:30000, ms ,防撤回时间，创建超过此时间，还没有被撤回的文件 ，视为不重要的文件，不再保护
* exts:["gif","png",...], 指定想要的文件后缀集合, 为空则保存所有类型文件


```
var remove_defender = require("../remove_defender");

   var watcher = new remove_defender({

   sourcePath: "D:\source",

   outputPath: "D:\output",

   timeout: 10000,

   exts: ["png", "jpg","gif","jpeg"],

   ifDefendUpdating:0

   });
   
   
   // 开始监听
   watcher.watch();

```



**listener**

添加事件
事件名

* added 文件被创建并保护
* saved 删除的文件成功被另存为
* timeout 文件超时未被删除，取消保护
* error 出错
* ready 监听准备完成

```
   watcher

       .on("ready", (settings) => {

           console.log("ready!",settings)

       })

       .on("added", (xPath) => {

           console.log("added:",xPath)

       })

       .on("saved", (xPath) => {

           console.log("saved:",xPath)

       })

       .on("timeout", (xPath) => {

           console.log("timeout:",xPath)

       })

       .on("err", (err) => {

           console.log("err:",err)

       });

```



**close**

关闭监听

```
watch.close()
```








