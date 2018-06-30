let chokidar = require('chokidar');
let fs = require("fs");
let path = require("path");

/*
 xOptions:{
 ifDefendUpdating:0/1, 存在则文件每次更新也会视作被添加
 sourcePath:"" ，防止文件撤回的文件夹， 一般qq图片文件夹在： 我的文档\\Tencent Files\\QQ号\\Image\\Group
 outputPath:"", 撤回图片保存的目录
 timeout:30000, ms ,防撤回时间，创建超过此时间，还没有被撤回的文件 ，视为不重要的文件，不再保护
 exts:["gif","png",...], 指定想要的文件后缀集合, 为空则保存所有类型文件
 }
 **/

// close()

module.exports=function (xOptions) {
    xOptions = xOptions || {};
    if (!xOptions.sourcePath || !xOptions.outputPath)throw Error("sourcePath or outputPath not found");
    let zThis = {
        settings: {
            // 需防撤回文件夹原路径
            sourcePath: xOptions.sourcePath,
            // 输出路径
            outputPath: outPutPath = xOptions.outputPath,
            //防撤回取消时间，创建超过此时间，未被撤回的文件，将放弃保护
            timeout: xOptions.timeout || 30000,
            // 需要防撤回的文件后缀  ["txt","jpg"...], 为空数组，则全部文件 防撤回
            exts: xOptions.exts || [],

            // 是否防御 文件被修改
            ifDefendUpdating:xOptions.ifDefendUpdating || 0
        },
        data: {
            //监听实例
            watcher: {},

            //每个文件的定时器
            //{<path>:setTimeout()}
            timerList:{},
            //图片内容列表
            // {<path>:{data:二进制图片,stats:源文件stat信息}}
            imgDataList:{},
            // 监听事件列表
            listenerList: {
                //文件被创建并保护
                added(xPath,xStats){
                  // console.log("文件被添加并保护：",xPath)
                },
                //撤回文件成功被另存为
                saved(xPath,xStats){
                    // console.log("保存成功：", xPath)
                },
                // 文件超时未被撤回，取消保护
                timeout(xPath,xStats){
                    // console.log("超时，取消保护：", xPath)
                },
                // 出错
                error(err){
                    // console.log("err", err)
                },
                // 监听准备完成
                ready(settings){
                    // console.log("ready")
                },

                }
        },
        events: {
            // 图片 被添加
            onImgAdded(xPath,xStats) {
               let zImgList=zThis.data.imgDataList;
                // 读取此图片
                fs.readFile(xPath, (err, data) => {
                    if (err)return zThis.data.listenerList.error(err);
                    zThis.data.listenerList.added(xPath,xStats);
                    zImgList[xPath] = {data: data};
                    // 清除旧的timer
                    if(zThis.data.timerList[xPath])clearTimeout(zThis.data.timerList[xPath]);
                    zThis.data.timerList[xPath]=setTimeout(() => {
                        // 如果30s 后，图片没有被撤回，则视为不重要，从列表中删除
                        if (zImgList[xPath]) {
                            delete zImgList[xPath];
                            zThis.data.listenerList.timeout(xPath,xStats);
                        }
                    }, zThis.settings.timeout)

                })
            },

            // 图片被删除
            onImgUnLinked(xPath,xStats){
                let zCurrentFile=zThis.data.imgDataList[xPath];
                if(!zCurrentFile)return;
                let zFileName = path.basename(xPath);
                // 保存被撤回的文件到输出目录
                fs.writeFile(path.join(zThis.settings.outputPath, zFileName), zCurrentFile.data, (err) => {
                    if (err)return zThis.data.listenerList.error(err);
                    zThis.data.listenerList.saved(xPath,xStats);
                    // 内存中删除数据
                    delete zThis.data.imgDataList[xPath];
                    // 取消定时器
                    clearTimeout(zThis.data.timerList[xPath])
                })
            }
        },
        methods: {
            //开始监听
            watch(){
                // qq 图片文件夹
                let zSourcePath = zThis.settings.sourcePath;

                // 输出路径
                let zOutPutPath = zThis.settings.sourcePath;

                // 后缀
                let zExts = zThis.settings.exts;

                let zChoOptions = {
                    persistent: true
                };
                if (zExts.length) {
                    let zIgnore = new RegExp(`\\.(?!(${zExts.join("|")})$)`,"i");
                    console.log("zIgnore",zIgnore)
                    zChoOptions.ignored = zIgnore;
                }
             // 监听qq 图片文件夹
                zThis.data.watcher = chokidar.watch(zSourcePath,zChoOptions);

                // 图片 内容列表
                var zImgDataList=zThis.data.imgDataList;
                //文件夹 监听准备完成
                var zIfReady=false;
                zThis.data.watcher
                //文件被添加
                    .on('add', function (xPath, xStats) {
                        if(zIfReady)zThis.events.onImgAdded(xPath,xStats);
                    })
                    //文件被修改
                    .on("change",function (xPath,xStats) {
                        if(zThis.settings.ifDefendUpdating)zThis.events.onImgAdded(xPath,xStats);
                    })
                    //文件被删除
                    .on('unlink', function (xPath,xStats) {
                       zThis.events.onImgUnLinked(xPath,xStats);
                    })
                    //出错信息
                    .on('error', function (err) {
                        zThis.data.listenerList.error(err)
                    })
                    //所有文件加载完
                    .on('ready', function () {
                      zThis.data.listenerList.ready(zThis.settings);
                        zIfReady=true;
                    });
            },
            close(){
                try{
                    for (let xTimer in  zThis.data.timerList) {
                      clearTimeout(zThis.data.timerList[xTimer]);
                    }
                    zThis.data.timerList={};
                    zThis.data.imgDataList={};
                    zThis.data.watcher.close();
                }catch(err){
                }
            },
            /*
             添加监听事件
             xEventName:事件名
                 added(xPath,xStats) 文件被创建并保护
                 saved(xPath,xStats) 删除的文件成功被另存为
                 timeout(xPath,xStats) 文件超时未被删除，取消保护
                 error(err) 出错
                 ready(settings) 监听准备完成
             xCallBack:回调
             */
            on(xEventName, xCallBack){
                if(zThis.data.listenerList[xEventName])zThis.data.listenerList[xEventName]=xCallBack;
                return this
            },

            // 取消事件监听
            off(xEventName){
                if(this.data.listenerList[xEventName])this.data.listenerList[xEventName]=()=>{};
                return this;
            },

        }

    };



    for (var xFunc in  zThis.methods) {
        this[xFunc] = zThis.methods[xFunc];
    }

};





