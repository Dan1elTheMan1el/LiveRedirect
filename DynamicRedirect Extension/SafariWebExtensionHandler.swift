import SafariServices
import Foundation
import os

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    private let logger = Logger(subsystem: "LiveRedirector", category: "ExtensionHandler")
    
    func beginRequest(with context: NSExtensionContext) {
        logger.log("beginRequest (no-op for LiveRedirector)")
        let response = NSExtensionItem()
        response.userInfo = ["ok": true]
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
