package com.gang_03.where2throw.trashsorter

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class TrashSorterPluginPackage : ReactPackage {
  companion object {
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("runWasteClassifier") { proxy, options ->
        TrashSorterPlugin(proxy, options)
      }
    }
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return emptyList()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}