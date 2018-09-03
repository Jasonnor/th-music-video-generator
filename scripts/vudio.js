/**
 * Web音频数据可视化模块
 * @author Margox
 * @version 0.0.1
 */

 (function(factory){

    /*
     * 添加UMD支持
     */

    if (typeof exports === 'object') {
         module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
         define(factory);
    } else {
         window.Vudio = factory();
    }

 })(function() {

    'use strict';

    // 默认参数
    var __default_option = {
        effect : 'waveform',
        accuracy : 128,
        width : 256,
        height : 100,
        waveform : {
            maxHeight : 80,
            minHeight : 1,
            spacing : 1,
            color : '#f00',
            shadowBlur : 0,
            shadowColor : '#f00',
            fadeSide : true,
            horizontalAlign : 'center',
            verticalAlign : 'middle',
            prettify : true
        },
        lighting : {
            maxHeight : 80,
            lineWidth: 0,
            color : '#f00',
            shadowBlur : 0,
            shadowColor : '#f00',
            fadeSide : true,
            horizontalAlign : 'center',
            verticalAlign : 'middle'
        }
    }

    /**
     * 构造函数
     * @param {object} audioSource HTMLAudioSource/MediaStream
     * @param {object} canvasElement HTMLCanvasElement
     * @param {object} option 可选配置参数
     */
    function Vudio(audioSource, canvasElement, option) {

        if (['[object HTMLAudioSource]', '[object HTMLAudioElement]', '[object MediaStream]'].indexOf(Object.prototype.toString.call(audioSource)) === -1) {
            throw new TypeError('Invaild Audio Source');
        }

        if (Object.prototype.toString.call(canvasElement) !== '[object HTMLCanvasElement]') {
            throw new TypeError('Invaild Canvas Element');
        }

        this.audioSrc = audioSource;
        this.canvasEle = canvasElement;
        this.option = __mergeOption(__default_option, option);
        this.meta = {};

        this.stat = 0;
        this.freqByteData = null;

        this.__init();

    }

    // private functions
    function __mergeOption() {

        var __result = {}

        Array.prototype.forEach.call(arguments, function(argument) {

            var __prop;
            var __value;

            for (__prop in argument) {
                if (Object.prototype.hasOwnProperty.call(argument, __prop)) {
                    if (Object.prototype.toString.call(argument[__prop]) === '[object Object]') {
                        __result[__prop] = __mergeOption(__result[__prop], argument[__prop]);
                    } else {
                        __result[__prop] = argument[__prop];
                    }
                }
            }

        });

        return __result;

    }

    Vudio.prototype = {

        __init : function() {

            var audioContext = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext),
                source = Object.prototype.toString.call(this.audioSrc) !== '[object MediaStream]' ? audioContext.createMediaElementSource(this.audioSrc) : audioContext.createMediaStreamSource(this.audioSrc),
                dpr = window.devicePixelRatio || 1;

            this.analyser = audioContext.createAnalyser();
            this.meta.spr = audioContext.sampleRate;

            source.connect(this.analyser);
            this.analyser.fftSize = this.option.accuracy * 2;
            this.analyser.connect(audioContext.destination);

            this.freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
            this.context2d = this.canvasEle.getContext('2d');
            this.width = this.option.width;
            this.height = this.option.height;

            // ready for HD screen
            this.context2d.canvas.width = this.width * dpr;
            this.context2d.canvas.height = this.height * dpr;
            this.context2d.scale(dpr, dpr);

        },

        __rebuildData : function (freqByteData, horizontalAlign) {

            var __freqByteData;

            if (horizontalAlign === 'center') {
                __freqByteData = [].concat(
                    Array.from(freqByteData).reverse().splice(this.option.accuracy / 2, this.option.accuracy / 2),
                    Array.from(freqByteData).splice(0, this.option.accuracy / 2)
                );
            } else if (horizontalAlign === 'left') {
                __freqByteData = freqByteData;
            } else if (horizontalAlign === 'right') {
                __freqByteData = Array.from(freqByteData).reverse();
            } else {
                __freqByteData = [].concat(
                    Array.from(freqByteData).reverse().splice(this.option.accuracy / 2, this.option.accuracy / 2),
                    Array.from(freqByteData).splice(0, this.option.accuracy / 2)
                );
            }

            return __freqByteData;

        },

        __animate : function() {

            if (this.stat === 1) {
                this.analyser.getByteFrequencyData(this.freqByteData);
                (typeof this.__effects()[this.option.effect] === 'function') && this.__effects()[this.option.effect](this.freqByteData);
                requestAnimationFrame(this.__animate.bind(this));
            }

        },

        __testFrame : function() {
            this.analyser.getByteFrequencyData(this.freqByteData);
            (typeof this.__effects()[this.option.effect] === 'function') && this.__effects()[this.option.effect](this.freqByteData);
        },

        // effect functions
        __effects : function() {

            var __that = this;

            return {

                lighting : function(freqByteData) {

                    var __lightingOption = __that.option.lighting;
                    var __freqByteData = __that.__rebuildData(freqByteData, __lightingOption.horizontalAlign);
                    var __maxHeight = __lightingOption.maxHeight / 2;
                    var __isStart = true, __fadeSide = true, __x, __y;

                    if (__lightingOption.horizontalAlign !== 'center') {
                        __fadeSide = false;
                    }

                    // clear canvas
                    __that.context2d.clearRect(0, 0, __that.width, __that.height);

                    // draw lighting
                    __that.context2d.lineWidth = __lightingOption.lineWidth;
                    __that.context2d.strokeStyle = __lightingOption.color;
                    __that.context2d.beginPath();
                    __freqByteData.forEach(function(value, index) {

                        __x = __that.width / __that.option.accuracy * index;
                        __y = value / 256 * __maxHeight;

                        if (__lightingOption.verticalAlign === 'middle') {
                            __y = (__that.height - value) / 2 - __maxHeight / 2;
                        } else if (__lightingOption.verticalAlign === 'bottom') {
                            __y =  __that.height - value;
                        } else if (__lightingOption.verticalAlign === 'top') {
                            __y = value;
                        } else {
                            __y = (__that.height - value) / 2 - __maxHeight / 2;
                        }

                        if (__isStart) {
                            __that.context2d.moveTo(__x, __y);
                            __isStart = false;
                        } else {
                            __that.context2d.lineTo(__x, __y);
                        }

                    });
                    __that.context2d.stroke();

                },

                waveform : function (freqByteData) {

                    var __waveformOption = __that.option.waveform;
                    var __fadeSide = __waveformOption.fadeSide;
                    var __prettify = __waveformOption.prettify;
                    var __freqByteData = __that.__rebuildData(freqByteData, __waveformOption.horizontalAlign);
                    var __maxHeight, __width, __height, __left, __top, __color, __linearGradient, __pos;

                    if (__waveformOption.horizontalAlign !== 'center') {
                        __fadeSide = false;
                        __prettify = false;
                    }

                    // clear canvas
                    __that.context2d.clearRect(0, 0, __that.width, __that.height);

                    // draw waveform
                    __freqByteData.forEach(function(value, index){

                        __width = (__that.width - __that.option.accuracy * __waveformOption.spacing) / __that.option.accuracy;
                        __left = index * (__width + __waveformOption.spacing);
                        __waveformOption.spacing !== 1 && (__left += __waveformOption.spacing / 2);
                        
                        if (__prettify) {
                            if (index <= __that.option.accuracy / 2) {
                                __maxHeight = (1 - (__that.option.accuracy / 2 - 1 - index) / ( __that.option.accuracy / 2)) * __waveformOption.maxHeight;
                            } else {
                                __maxHeight = (1 - (index - __that.option.accuracy / 2) / ( __that.option.accuracy / 2)) * __waveformOption.maxHeight;
                            }
                        } else {
                            __maxHeight = __waveformOption.maxHeight;
                        }

                        __height = value / 256 * __maxHeight;    
                        __height = __height < __waveformOption.minHeight ? __waveformOption.minHeight : __height;

                        if (__waveformOption.verticalAlign === 'middle') {
                            __top = (__that.height - __height) / 2;
                        } else if (__waveformOption.verticalAlign === 'top') {
                            __top = 0;
                        } else if (__waveformOption.verticalAlign === 'bottom') {
                            __top = __that.height - __height;
                        } else {
                            __top = (__that.height - __height) / 2;
                        }

                        __color = __waveformOption.color;

                        if (__color instanceof Array) {

                            __linearGradient = __that.context2d.createLinearGradient(
                                __left,
                                __top,
                                __left,
                                __top + __height
                            );

                            __color.forEach(function(color, index) {
                                if (color instanceof Array) {
                                    __pos = color[0];
                                    color = color[1];
                                } else if (index === 0 || index === __color.length - 1) {
                                    __pos = index / (__color.length - 1);
                                } else {
                                    __pos =  index / __color.length + 0.5 / __color.length;
                                }
                                __linearGradient.addColorStop(__pos, color);
                            });

                            __that.context2d.fillStyle = __linearGradient;

                        } else {
                            __that.context2d.fillStyle = __color;
                        }

                        if (__waveformOption.shadowBlur > 0) {
                            __that.context2d.shadowBlur = __waveformOption.shadowBlur;
                            __that.context2d.shadowColor = __waveformOption.shadowColor;
                        }

                        if (__fadeSide) {
                            if (index <= __that.option.accuracy / 2) {
                                __that.context2d.globalAlpha = 1 - (__that.option.accuracy / 2 - 1 - index) / ( __that.option.accuracy / 2);
                            } else {
                                __that.context2d.globalAlpha = 1 - (index - __that.option.accuracy / 2) / ( __that.option.accuracy / 2);
                            }
                        } else {
                           __that.context2d.globalAlpha = 1;
                        }

                        __that.context2d.fillRect(__left, __top, __width, __height);

                    });

                }

            }

        },

        // 开始
        dance : function() {
            if (this.stat === 0) {
                this.stat = 1;
                this.__animate();
            }
            return this;
        },

        // 暂停
        pause : function() {
            this.stat = 0;
            return this;
        },

        // 改变参数
        setOption : function(option) {
            this.option = __mergeOption(this.option, option);
        }

    };

    return Vudio;

 });