package com.fynx.elite.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetPinModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetPinModule"
    }

    @ReactMethod
    fun requestPin(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val context = reactApplicationContext
                val appWidgetManager = AppWidgetManager.getInstance(context)
                
                if (appWidgetManager != null && appWidgetManager.isRequestPinAppWidgetSupported) {
                    val myProvider = ComponentName(context, FynxWidget::class.java)
                    val success = appWidgetManager.requestPinAppWidget(myProvider, null, null)
                    promise.resolve(success)
                } else {
                    promise.resolve(false)
                }
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("WIDGET_ERROR", e.message)
        }
    }
}
